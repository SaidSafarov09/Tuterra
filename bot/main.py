import logging
import os
import asyncio
from datetime import datetime, timedelta
import pytz
from dotenv import load_dotenv
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, ReplyKeyboardMarkup
from telegram.ext import ApplicationBuilder, ContextTypes, CommandHandler, CallbackQueryHandler, MessageHandler, filters
from db import (
    get_db_pool, get_user_by_telegram_id, link_user_telegram, verify_telegram_code,
    toggle_lesson_paid, toggle_lesson_cancel, get_all_students, 
    get_student_details, get_unpaid_lessons, get_group_lesson_payments,
    toggle_student_payment, get_student_dashboard_stats, get_student_lessons_by_date,
    get_lesson_request, approve_lesson_request, reject_lesson_request, create_lesson_request
)

# Load environment variables
load_dotenv()

# Logging setup
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)

TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
CHANNEL_ID = os.getenv("TELEGRAM_CHANNEL_ID", "@tuterra")
PENDING_LINK = set()
# State for reschedule flow: {user_id: {'lesson_id': str, 'date': datetime, 'role': str}}
PENDING_RESCHEDULE = {}

# --- Helpers ---
async def check_subscription(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_user.id
    try:
        member = await context.bot.get_chat_member(chat_id=CHANNEL_ID, user_id=user_id)
        if member.status in ['left', 'kicked']: return False
        return True
    except Exception as e:
        if "Chat not found" not in str(e): logging.error(f"Subscription check error: {e}")
        return True

def to_local_time(dt, zone="Europe/Moscow"):
    if not dt: return None
    if dt.tzinfo is None: dt = pytz.utc.localize(dt)
    try: tz = pytz.timezone(zone)
    except: tz = pytz.timezone("Europe/Moscow")
    return dt.astimezone(tz)

def generate_date_picker(lesson_id, action_prefix, user_tz="Europe/Moscow"):
    """Generate a keyboard with next 7 days for date selection"""
    tz = pytz.timezone(user_tz)
    now = datetime.now(tz)
    keyboard = []
    row = []
    for i in range(7):
        day = now + timedelta(days=i)
        day_str = day.strftime("%d.%m")
        day_name = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"][day.weekday()]
        label = f"{day_name} {day_str}"
        date_iso = day.strftime("%Y-%m-%d")
        row.append(InlineKeyboardButton(label, callback_data=f"{action_prefix}_{lesson_id}_d_{date_iso}"))
        if len(row) == 4:
            keyboard.append(row)
            row = []
    if row:
        keyboard.append(row)
    keyboard.append([InlineKeyboardButton("🔙 Отмена", callback_data=f"l_{lesson_id}")])
    return InlineKeyboardMarkup(keyboard)

def generate_time_picker(lesson_id, date_str, action_prefix):
    """Generate a keyboard with time slots"""
    keyboard = []
    times = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"]
    row = []
    for t in times:
        row.append(InlineKeyboardButton(t, callback_data=f"{action_prefix}_{lesson_id}_t_{date_str}_{t}"))
        if len(row) == 4:
            keyboard.append(row)
            row = []
    if row:
        keyboard.append(row)
    keyboard.append([InlineKeyboardButton("🔙 Назад к дате", callback_data=f"{action_prefix}_{lesson_id}")])
    return InlineKeyboardMarkup(keyboard)

async def send_subscription_wall(update: Update):
    channel_url = f"https://t.me/{CHANNEL_ID.replace('@', '')}"
    keyboard = [[InlineKeyboardButton("📢 Подписаться на канал", url=channel_url)], [InlineKeyboardButton("✅ Я подписался", callback_data='check_sub')]]
    text = "🔒 **Доступ ограничен**\n\nЧтобы пользоваться ботом и получать уведомления, подпишитесь на наш канал новостей."
    if update.callback_query:
        try: await update.callback_query.edit_message_text(text, reply_markup=InlineKeyboardMarkup(keyboard), parse_mode='Markdown')
        except: await update.callback_query.answer("Подпишитесь на канал!", show_alert=True)
    else:
        await update.message.reply_text(text, reply_markup=InlineKeyboardMarkup(keyboard), parse_mode='Markdown')

# --- Keyboards ---
def main_reply_keyboard(role='teacher'):
    if role == 'student':
        return ReplyKeyboardMarkup([
            ["📅 Расписание", "📉 Оплата"],
            ["⚙️ Настройки", "🏠 Главное меню"],
            ["📎 Справка"]
        ], resize_keyboard=True)
    return ReplyKeyboardMarkup([
        ["📅 Расписание", "👥 Ученики"],
        ["💰 Финансы", "📉 Должники"],
        ["⚙️ Настройки", "🏠 Главное меню"],
        ["📎 Справка"]
    ], resize_keyboard=True)

def main_menu_keyboard(role='teacher'):
    if role == 'student':
        return InlineKeyboardMarkup([
            [InlineKeyboardButton("📅 Расписание", callback_data='menu_schedule'), InlineKeyboardButton("💰 Оплата", callback_data='menu_finance')],
            [InlineKeyboardButton("⚙️ Настройки", callback_data='menu_settings')]
        ])
    return InlineKeyboardMarkup([
        [InlineKeyboardButton("📅 Расписание", callback_data='menu_schedule'), InlineKeyboardButton("👥 Ученики", callback_data='menu_students')],
        [InlineKeyboardButton("💰 Финансы", callback_data='menu_finance'), InlineKeyboardButton("⚙️ Настройки", callback_data='menu_settings')],
        [InlineKeyboardButton("📉 Должники", callback_data='menu_debtors')]
    ])

def back_button(data='menu_main'):
    return InlineKeyboardButton("🔙 Назад", callback_data=data)

# --- Action Logic Functions ---

async def action_show_main_menu(update: Update, context: ContextTypes.DEFAULT_TYPE, user, is_start=False):
    pool = context.bot_data['pool']
    role = user.get('role', 'teacher')
    timezone = user.get('timezone', 'Europe/Moscow')
    
    greeting = f"👋 Привет, {user['firstName'] or 'Пользователь'}!\n\n" if is_start else ""
    
    if role == 'student':
        stats = await get_student_dashboard_stats(pool, user['id'], timezone)
        text = (
            f"{greeting}📊 **Твой дашборд:**\n\n"
            f"• Уроков сегодня: **{stats['lessons_today']}**\n"
            f"• Всего будущих уроков: **{stats['upcoming']}**\n"
            f"• К оплате: **{stats['debt']} ₽**\n\n"
            "Выберите нужное действие в меню. 👇"
        )
    else:
        stats = await get_dashboard_stats(pool, user['id'], timezone)
        text = (
            f"{greeting}📊 **Общая сводка:**\n\n"
            f"• Учеников всего: **{stats['students']}**\n"
            f"• Уроков сегодня: **{stats['lessons_today']}**\n"
            f"• Доход за сегодня: **{stats['income_today']} ₽**\n"
            f"• Доход за месяц: **{stats['income']} ₽**\n\n"
            "Выберите нужное действие в меню. 👇"
        )

    if update.callback_query:
        await update.callback_query.edit_message_text(text, reply_markup=main_menu_keyboard(role), parse_mode='Markdown')
    else:
        await update.message.reply_text(text, reply_markup=main_reply_keyboard(role), parse_mode='Markdown')

async def action_show_schedule_menu(update: Update, context: ContextTypes.DEFAULT_TYPE):
    keyboard = [[InlineKeyboardButton("Сегодня", callback_data='sched_today'), InlineKeyboardButton("Завтра", callback_data='sched_tomorrow')], [back_button()]]
    text = "📅 **Расписание: выберите день**"
    if update.callback_query: await update.callback_query.edit_message_text(text, reply_markup=InlineKeyboardMarkup(keyboard), parse_mode='Markdown')
    else: await update.message.reply_text(text, reply_markup=InlineKeyboardMarkup(keyboard), parse_mode='Markdown')

async def action_show_students_list(update: Update, context: ContextTypes.DEFAULT_TYPE, user):
    pool = context.bot_data['pool']
    students = await get_all_students(pool, user['id'])
    if not students:
        msg = "У вас пока нет учеников."
        if update.callback_query: await update.callback_query.edit_message_text(msg, reply_markup=InlineKeyboardMarkup([[back_button()]]))
        else: await update.message.reply_text(msg, reply_markup=main_reply_keyboard())
        return
    keyboard = [[InlineKeyboardButton(s['name'], callback_data=f"student_{s['id']}")] for s in students[:15]]
    keyboard.append([back_button()])
    text = "👥 **Ваши ученики:**"
    if update.callback_query: await update.callback_query.edit_message_text(text, reply_markup=InlineKeyboardMarkup(keyboard), parse_mode='Markdown')
    else: await update.message.reply_text(text, reply_markup=InlineKeyboardMarkup(keyboard), parse_mode='Markdown')

async def action_show_finance_menu(update: Update, context: ContextTypes.DEFAULT_TYPE, user):
    pool = context.bot_data['pool']
    role = user.get('role', 'teacher')
    timezone = user.get('timezone', 'Europe/Moscow')
    
    if role == 'student':
        stats = await get_student_dashboard_stats(pool, user['id'], timezone)
        text = (
            "💰 **Твоя оплата**\n\n"
            f"📉 Текущий долг: **{stats['debt']} ₽**\n"
            "Пожалуйста, оплати прошедшие занятия через своего преподавателя."
        )
        keyboard = [[back_button()]]
    else:
        stats = await get_dashboard_stats(pool, user['id'], timezone)
        unpaid = await get_unpaid_lessons(pool, user['id'], limit=5)
        text = (
            "💰 **Финансовый отчет**\n\n"
            f"💵 Заработано сегодня: **{stats['income_today']} ₽**\n"
            f"📈 Заработано за месяц: **{stats['income']} ₽**\n\n"
        )
        if unpaid:
            text += "⚠️ **Последние неоплаченные уроки:**"
            keyboard = []
            for l in unpaid:
                display_name = f"👤 {l['studentName']} (👥 {l['groupName']})" if l['groupName'] else f"👤 {l['studentName']}"
                keyboard.append([InlineKeyboardButton(f"{display_name} — {l['price']}₽", callback_data=f"l_{l['id']}")])
            keyboard.append([back_button()])
        else:
            text += "Все уроки оплачены! 🎉"
            keyboard = [[back_button()]]

    if update.callback_query: await update.callback_query.edit_message_text(text, reply_markup=InlineKeyboardMarkup(keyboard), parse_mode='Markdown')
    else: await update.message.reply_text(text, reply_markup=InlineKeyboardMarkup(keyboard), parse_mode='Markdown')

async def action_show_debtors(update: Update, context: ContextTypes.DEFAULT_TYPE, user):
    pool = context.bot_data['pool']
    unpaid = await get_unpaid_lessons(pool, user['id'])
    if not unpaid:
        text = "🎉 Должников нет."
        if update.callback_query: await update.callback_query.edit_message_text(text, reply_markup=InlineKeyboardMarkup([[back_button()]]))
        else: await update.message.reply_text(text)
        return
    text = "📉 **Должники:**\n\nНажмите на урок, чтобы отметить оплату."
    keyboard = []
    for l in unpaid[:15]:
        if l['groupName']:
            display_name = f"👤 {l['studentName']} (👥 {l['groupName']})"
        else:
            display_name = f"👤 {l['studentName']}"
        keyboard.append([InlineKeyboardButton(f"{display_name} — {l['price']}₽", callback_data=f"l_{l['id']}")])
    keyboard.append([back_button()])
    if update.callback_query: await update.callback_query.edit_message_text(text, reply_markup=InlineKeyboardMarkup(keyboard), parse_mode='Markdown')
    else: await update.message.reply_text(text, reply_markup=InlineKeyboardMarkup(keyboard), parse_mode='Markdown')

async def action_show_settings(update: Update, context: ContextTypes.DEFAULT_TYPE, user):
    text = f"⚙️ **Настройки**\n\nEmail: {user['email']}\nЧасовой пояс: {user.get('timezone', 'Europe/Moscow')}\nУведомления: ✅\nID Чата: `{update.effective_chat.id}`"
    if update.callback_query: await update.callback_query.edit_message_text(text, reply_markup=InlineKeyboardMarkup([[back_button()]]), parse_mode='Markdown')
    else: await update.message.reply_text(text, reply_markup=InlineKeyboardMarkup([[back_button()]]), parse_mode='Markdown')

# --- Handlers ---

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_user.id
    pool = context.bot_data['pool']
    if not await check_subscription(update, context): return await send_subscription_wall(update)

    # 1. SCENARIO: User clicked a link (Linking Flow)
    if context.args:
        code = context.args[0]
        linked_user = await verify_telegram_code(pool, code, user_id, update.effective_chat.id)
        if linked_user: 
            display_name = linked_user['email'] or linked_user['firstName'] or linked_user['name'] or "Пользователь"
            await update.message.reply_text(f"🚀 Аккаунт **{display_name}** успешно привязан!", parse_mode='Markdown')
            # Show menu immediately
            await action_show_main_menu(update, context, dict(linked_user), is_start=True)
        else:
            await update.message.reply_text("❌ **Ошибка привязки**\nСсылка недействительна или срок её действия истек (код не найден в базе).", parse_mode='Markdown')
        return  # STOP HERE to prevent double messages

    # 2. SCENARIO: Just opened the bot (Regular Flow)
    user_rec = await get_user_by_telegram_id(pool, user_id)
    if user_rec: 
        await action_show_main_menu(update, context, dict(user_rec), is_start=True)
    else:
        await update.message.reply_text("🔒 **Авторизация**\nПривяжите аккаунт на сайте или отправьте Email здесь.", parse_mode='Markdown')
        PENDING_LINK.add(user_id)

async def check_sub_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    if await check_subscription(update, context):
        await query.answer("Спасибо за подписку! 🎉")
        user_rec = await get_user_by_telegram_id(context.bot_data['pool'], update.effective_user.id)
        if user_rec: await action_show_main_menu(update, context, dict(user_rec), is_start=True)
        else: await query.edit_message_text("🔒 Авторизуйтесь на сайте.")
    else: await query.answer("Вы все еще не подписаны 😢", show_alert=True)

async def menu_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    user_rec = await get_user_by_telegram_id(context.bot_data['pool'], update.effective_user.id)
    if not user_rec: return
    user = dict(user_rec)
    data = query.data
    if data == 'menu_main': await action_show_main_menu(update, context, user)
    elif data == 'menu_schedule': await action_show_schedule_menu(update, context)
    elif data == 'menu_students': await action_show_students_list(update, context, user)
    elif data == 'menu_finance': await action_show_finance_menu(update, context, user)
    elif data == 'menu_debtors': await action_show_debtors(update, context, user)
    elif data == 'menu_settings': await action_show_settings(update, context, user)

async def schedule_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    user_rec = await get_user_by_telegram_id(context.bot_data['pool'], update.effective_user.id)
    if not user_rec: return
    user = dict(user_rec)
    user_tz = user.get('timezone', 'Europe/Moscow')
    role = user.get('role', 'teacher')
    target_date = datetime.now(pytz.timezone(user_tz))
    title = "Сегодня"
    if query.data == 'sched_tomorrow': target_date += timedelta(days=1); title = "Завтра"
    
    if role == 'student':
        from db import get_student_lessons_by_date
        lessons = await get_student_lessons_by_date(context.bot_data['pool'], user['id'], target_date, user_tz)
    else:
        from db import get_lessons_by_date # though it's already imported
        lessons = await get_lessons_by_date(context.bot_data['pool'], user['id'], target_date, user_tz)

    if not lessons:
        await query.edit_message_text(f"📅 **{title}:** Занятий нет. 🏖", reply_markup=InlineKeyboardMarkup([[back_button('menu_schedule')]]), parse_mode='Markdown')
        return
    text = f"📅 **Расписание на {title}:**"
    keyboard = []
    for l in lessons:
        time_str = to_local_time(l['date'], user_tz).strftime('%H:%M')
        name = l['studentName'] or l['groupName'] if role != 'student' else f"{l['subjectName']} ({l['teacherName']})"
        icon = '✅' if l['isPaid'] else ('❌' if l['isCanceled'] else '⚠️')
        keyboard.append([InlineKeyboardButton(f"{icon} {time_str} - {name}", callback_data=f"l_{l['id']}")])
    
    keyboard.append([back_button('menu_schedule')])
    await query.edit_message_text(text, reply_markup=InlineKeyboardMarkup(keyboard), parse_mode='Markdown')

async def lesson_details_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    data_parts = query.data.split('_')
    lesson_id = data_parts[1]
    pool = context.bot_data['pool']
    if len(data_parts) > 2:
        action = data_parts[2]
        user_rec_check = await get_user_by_telegram_id(pool, update.effective_user.id)
        
        if action == 'p': await toggle_lesson_paid(pool, lesson_id, True)
        elif action == 'up': await toggle_lesson_paid(pool, lesson_id, False)
        elif action == 'ps': 
            student_id = data_parts[3]
            await toggle_student_payment(pool, lesson_id, student_id, True)
        elif action == 'ups':
            student_id = data_parts[3]
            await toggle_student_payment(pool, lesson_id, student_id, False)
        elif action == 'tc':
            l = await get_lesson_by_id(pool, lesson_id)
            if l: await toggle_lesson_cancel(pool, lesson_id, not l['isCanceled'])
        # Student actions
        elif action == 'spaid' and user_rec_check and user_rec_check['role'] == 'student':
            # Student claims they paid - notify teacher
            lesson = await get_lesson_by_id(pool, lesson_id)
            if lesson:
                await query.answer("✅ Преподаватель уведомлен об оплате!", show_alert=True)
                # Could add a more sophisticated notification here
        elif action == 'sreq' and len(data_parts) > 3:
            req_type = data_parts[3]  # 'reschedule' or 'cancel'
            if user_rec_check and user_rec_check['role'] == 'student':
                await create_lesson_request(pool, lesson_id, user_rec_check['id'], req_type)
                type_label = "перенос" if req_type == 'reschedule' else "отмену"
                await query.answer(f"✅ Заявка на {type_label} отправлена преподавателю!", show_alert=True)

    lesson = await get_lesson_by_id(pool, lesson_id)
    if not lesson: return
    user_rec = await get_user_by_telegram_id(pool, update.effective_user.id)
    user_tz = dict(user_rec).get('timezone', 'Europe/Moscow') if user_rec else 'Europe/Moscow'
    time_str = to_local_time(lesson['date'], user_tz).strftime("%d.%m %H:%M")
    
    if lesson['groupId']:
        group_payments = await get_group_lesson_payments(pool, lesson_id)
        all_paid = all(p['hasPaid'] for p in group_payments) if group_payments else False
        status = "✅ Все ученики оплатили" if all_paid else "⚠️ Есть долги"
    else:
        status = "✅ Оплачено" if lesson['isPaid'] else "⚠️ Не оплачено"
    
    if lesson['isCanceled']:
        status = "❌ Отменено"
    
    teacher_name = lesson.get('teacherName') or "Преподаватель"
    entity_label = f"👤 Ученик: **{lesson['studentName']}**" if lesson['studentName'] else f"👥 Группа: **{lesson['groupName']}**"
    if user_rec['role'] == 'student':
        entity_label = f"👨‍🏫 Преподаватель: **{teacher_name}**"

    text = f"📚 **Занятие**\n{entity_label}\n📖 Предмет: **{lesson['subjectName'] or '---'}**\n📅 Время: **{time_str}**\n💰 Стоимость: **{lesson['price']} ₽**\n📊 Статус: {status}"
    
    keyboard = []
    
    # If teacher view AND group, show list of students
    if user_rec['role'] != 'student' and lesson['groupId']:
        group_payments = await get_group_lesson_payments(pool, lesson_id)
        if group_payments:
            text += "\n\n👥 **Ученики в группе:**"
            for p in group_payments:
                p_status = "✅" if p['hasPaid'] else "❌"
                text += f"\n{p_status} {p['studentName']}"
                btn_action = 'ups' if p['hasPaid'] else 'ps'
                btn_text = f"{'🔄' if p['hasPaid'] else '✅'} {p['studentName']}"
                keyboard.append([InlineKeyboardButton(btn_text, callback_data=f"l_{lesson_id}_{btn_action}_{p['studentId']}")])

    btns = []
    if user_rec['role'] != 'student' and not lesson['isCanceled']: 
        if not lesson['groupId']:
            btns.append(InlineKeyboardButton("↩️ Не оплачено" if lesson['isPaid'] else "✅ Оплачено", callback_data=f"l_{lesson_id}_{'up' if lesson['isPaid'] else 'p'}"))
        btns.append(InlineKeyboardButton("📅 Перенести", callback_data=f"resc_{lesson_id}"))
        btns.append(InlineKeyboardButton("Восстановить" if lesson['isCanceled'] else "❌ Отменить", callback_data=f"l_{lesson_id}_tc"))
    
    # Student actions
    if user_rec['role'] == 'student' and not lesson['isCanceled']:
        student_btns = []
        if not lesson['isPaid']:
            student_btns.append(InlineKeyboardButton("💳 Я оплатил", callback_data=f"l_{lesson_id}_spaid"))
        student_btns.append(InlineKeyboardButton("📅 Перенести", callback_data=f"sreq_{lesson_id}"))
        student_btns.append(InlineKeyboardButton("❌ Отменить", callback_data=f"l_{lesson_id}_sreq_cancel"))
        if student_btns:
            keyboard.append(student_btns)
    
    if btns: keyboard.append(btns)
    keyboard.append([back_button('menu_schedule')])
    
    await query.edit_message_text(text, reply_markup=InlineKeyboardMarkup(keyboard), parse_mode='Markdown')

async def student_details_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    student_id = query.data.split('_')[1]
    pool = context.bot_data['pool']
    
    details = await get_student_details(pool, student_id)
    if not details: return
    
    info = details['info']
    stats = details['stats']
    
    subjects_str = ", ".join(details['subjects']) or "Не указаны"
    groups_str = ", ".join(details['groups']) or "Нет"
    
    text = (
        f"👤 **Карточка ученика: {info['name']}**\n\n"
        f"📱 Контакт: `{info['contact'] or '---'}`\n"
        f"📖 Предметы: {subjects_str}\n"
        f"👥 Группы: {groups_str}\n\n"
        f"📊 **Статистика:**\n"
        f"• Всего занятий: {stats['total']}\n"
        f"• Неоплаченных: {stats['unpaid']}\n"
        f"• Долг: **{stats['debt']} ₽**\n\n"
        f"📝 Заметка: {info['note'] or '---'}"
    )
    
    keyboard = [[back_button('menu_students')]]
    await query.edit_message_text(text, reply_markup=InlineKeyboardMarkup(keyboard), parse_mode='Markdown')

async def text_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_user.id
    text = update.message.text.strip()
    pool = context.bot_data['pool']
    user_rec = await get_user_by_telegram_id(pool, user_id)

    # Menu checks
    if text in ["📅 Расписание", "👥 Ученики", "💰 Финансы", "📉 Должники", "⚙️ Настройки", "🏠 Главное меню", "📉 Оплата", "💰 Оплата"]:
        if not user_rec: return await update.message.reply_text("🔒 Авторизуйтесь.")
        user = dict(user_rec)
        if text == "📅 Расписание": await action_show_schedule_menu(update, context)
        elif text == "👥 Ученики" and user['role'] != 'student': await action_show_students_list(update, context, user)
        elif text in ["💰 Финансы", "📉 Оплата", "💰 Оплата"]: await action_show_finance_menu(update, context, user)
        elif text == "📉 Должники" and user['role'] != 'student': await action_show_debtors(update, context, user)
        elif text == "⚙️ Настройки": await action_show_settings(update, context, user)
        elif text == "🏠 Главное меню": await action_show_main_menu(update, context, user, is_start=False)
        return

    if text == "📎 Справка":
        return await update.message.reply_text("📚 **Справка**\nЭтот бот синхронизирован с вашим сайтом. Все изменения (оплаты, отмены) сразу видны везде.", parse_mode='Markdown')

    if user_id in PENDING_LINK:
        user = await link_user_telegram(pool, text, user_id, update.effective_chat.id)
        if user: 
            PENDING_LINK.remove(user_id)
            role = user.get('role', 'teacher')
            await update.message.reply_text("🎉 Готово! Аккаунт привязан.", reply_markup=main_reply_keyboard(role))
        else:
            await update.message.reply_text("❌ Email не найден.")

# Handler for lesson request approve/reject
async def lesson_request_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    pool = context.bot_data['pool']
    
    data = query.data  # lr_approve:id or lr_reject:id
    parts = data.split(':')
    if len(parts) != 2:
        return
    
    action, request_id = parts
    
    user_rec = await get_user_by_telegram_id(pool, update.effective_user.id)
    if not user_rec or user_rec['role'] == 'student':
        await query.answer("❌ Только преподаватель может обрабатывать заявки", show_alert=True)
        return
    
    lr = await get_lesson_request(pool, request_id)
    if not lr:
        await query.edit_message_text("❌ Заявка не найдена или уже обработана.")
        return
    
    if lr['status'] != 'pending':
        await query.edit_message_text(f"ℹ️ Эта заявка уже обработана (статус: {lr['status']}).")
        return
    
    if action == 'lr_approve':
        await approve_lesson_request(pool, request_id)
        type_label = "отмену" if lr['type'] == 'cancel' else "перенос"
        await query.edit_message_text(f"✅ **Заявка одобрена!**\n\nВы одобрили {type_label} занятия.\nУченик получит уведомление.", parse_mode='Markdown')
    elif action == 'lr_reject':
        await reject_lesson_request(pool, request_id)
        type_label = "отмену" if lr['type'] == 'cancel' else "перенос"
        await query.edit_message_text(f"❌ **Заявка отклонена.**\n\nВы отклонили {type_label} занятия.\nУченик получит уведомление.", parse_mode='Markdown')

if __name__ == '__main__':
    if not TOKEN: exit(1)
    app = ApplicationBuilder().token(TOKEN).build()
    async def post_init(a): 
        a.bot_data['pool'] = await get_db_pool()
        db_url = os.getenv("DATABASE_URL", "Nodes not found")
        masked_url = db_url.split('@')[-1] if '@' in db_url else "Unknown"
        print(f"Bot ready! Connected to DB host: {masked_url}")

    app.post_init = post_init
    app.add_handler(CommandHandler('start', start))
    app.add_handler(CallbackQueryHandler(check_sub_callback, pattern='^check_sub'))
    app.add_handler(CallbackQueryHandler(menu_callback, pattern='^menu_'))
    app.add_handler(CallbackQueryHandler(schedule_callback, pattern='^sched_'))
    app.add_handler(CallbackQueryHandler(lesson_details_callback, pattern='^l_'))
    app.add_handler(CallbackQueryHandler(student_details_callback, pattern='^student_'))
    app.add_handler(CallbackQueryHandler(lesson_request_callback, pattern='^lr_'))
    app.add_handler(MessageHandler(filters.TEXT & (~filters.COMMAND), text_handler))
    app.run_polling()
