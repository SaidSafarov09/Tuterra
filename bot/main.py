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
    get_dashboard_stats, get_lessons_by_date, get_lesson_by_id, 
    toggle_lesson_paid, toggle_lesson_cancel, get_all_students, 
    get_student_details, get_unpaid_lessons
)

# Load environment variables
load_dotenv()

# Logging setup
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)

TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
CHANNEL_ID = os.getenv("TELEGRAM_CHANNEL_ID", "@tuterra_news")
PENDING_LINK = set()

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
def main_reply_keyboard():
    return ReplyKeyboardMarkup([
        ["📅 Расписание", "👥 Ученики"],
        ["💰 Финансы", "📉 Должники"],
        ["⚙️ Настройки", "🏠 Главное меню"],
        ["📎 Справка"]
    ], resize_keyboard=True)

def main_menu_keyboard():
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
    stats = await get_dashboard_stats(pool, user['id'], user.get('timezone', 'Europe/Moscow'))
    
    greeting = f"👋 Привет, {user['firstName'] or 'Преподаватель'}!\n\n" if is_start else ""
    
    text = (
        f"{greeting}📊 **Общая сводка:**\n\n"
        f"• Учеников всего: **{stats['students']}**\n"
        f"• Уроков сегодня: **{stats['lessons_today']}**\n"
        f"• Доход за сегодня: **{stats['income_today']} ₽**\n"
        f"• Доход за месяц: **{stats['income']} ₽**\n\n"
        "Выберите нужное действие в меню. 👇"
    )
    if update.callback_query:
        await update.callback_query.edit_message_text(text, reply_markup=main_menu_keyboard(), parse_mode='Markdown')
    else:
        await update.message.reply_text(text, reply_markup=main_reply_keyboard(), parse_mode='Markdown')

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
    stats = await get_dashboard_stats(pool, user['id'], user.get('timezone', 'Europe/Moscow'))
    unpaid = await get_unpaid_lessons(pool, user['id'], limit=5)
    
    text = (
        "💰 **Финансовый отчет**\n\n"
        f"💵 Заработано сегодня: **{stats['income_today']} ₽**\n"
        f"📈 Заработано за месяц: **{stats['income']} ₽**\n\n"
    )
    
    if unpaid:
        text += "⚠️ **Последние неоплаченные уроки:**"
        keyboard = [[InlineKeyboardButton(f"{l['studentName']} ({l['price']}₽)", callback_data=f"lesson_{l['id']}")] for l in unpaid]
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
    keyboard = [[InlineKeyboardButton(f"{l['studentName']} ({l['price']}₽)", callback_data=f"lesson_{l['id']}")] for l in unpaid[:15]]
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

    if context.args:
        linked_user = await verify_telegram_code(pool, context.args[0], user_id, update.effective_chat.id)
        if linked_user: 
            await update.message.reply_text(f"🚀 Аккаунт **{linked_user['email']}** привязан!", parse_mode='Markdown')

    user_rec = await get_user_by_telegram_id(pool, user_id)
    if user_rec: await action_show_main_menu(update, context, dict(user_rec), is_start=True)
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
    target_date = datetime.now(pytz.timezone(user_tz))
    title = "Сегодня"
    if query.data == 'sched_tomorrow': target_date += timedelta(days=1); title = "Завтра"
    lessons = await get_lessons_by_date(context.bot_data['pool'], user['id'], target_date, user_tz)
    if not lessons:
        await query.edit_message_text(f"📅 **{title}:** Занятий нет. 🏖", reply_markup=InlineKeyboardMarkup([[back_button('menu_schedule')]]), parse_mode='Markdown')
        return
    text = f"📅 **Расписание на {title}:**"
    keyboard = [[InlineKeyboardButton(f"{'✅' if l['isPaid'] else ('❌' if l['isCanceled'] else '⚠️')} {to_local_time(l['date'], user_tz).strftime('%H:%M')} - {l['studentName'] or l['groupName']}", callback_data=f"lesson_{l['id']}")] for l in lessons]
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
        if action == 'pay': await toggle_lesson_paid(pool, lesson_id, True)
        elif action == 'unpay': await toggle_lesson_paid(pool, lesson_id, False)
        elif action == 'togglecancel':
            l = await get_lesson_by_id(pool, lesson_id)
            if l: await toggle_lesson_cancel(pool, lesson_id, not l['isCanceled'])

    lesson = await get_lesson_by_id(pool, lesson_id)
    if not lesson: return
    user_rec = await get_user_by_telegram_id(pool, update.effective_user.id)
    user_tz = dict(user_rec).get('timezone', 'Europe/Moscow') if user_rec else 'Europe/Moscow'
    time_str = to_local_time(lesson['date'], user_tz).strftime("%d.%m %H:%M")
    status = "❌ ОТМЕНЕНО" if lesson['isCanceled'] else ("✅ ОПЛАЧЕНО" if lesson['isPaid'] else "⚠️ НЕ ОПЛАЧЕНО")
    text = f"📚 **Урок: {lesson['studentName'] or lesson['groupName']}**\n📅 {time_str}\n📖 {lesson['subjectName'] or '---'}\n💰 {lesson['price']} ₽\n📊 {status}"
    btns = []
    if not lesson['isCanceled']: btns.append(InlineKeyboardButton("↩️ Не оплачено" if lesson['isPaid'] else "✅ Оплачено", callback_data=f"lesson_{lesson_id}_{'unpay' if lesson['isPaid'] else 'pay'}"))
    btns.append(InlineKeyboardButton("Восстановить" if lesson['isCanceled'] else "❌ Отменить", callback_data=f"lesson_{lesson_id}_togglecancel"))
    await query.edit_message_text(text, reply_markup=InlineKeyboardMarkup([btns, [back_button('menu_schedule')]]), parse_mode='Markdown')

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
    if text in ["📅 Расписание", "👥 Ученики", "💰 Финансы", "📉 Должники", "⚙️ Настройки", "🏠 Главное меню"]:
        if not user_rec: return await update.message.reply_text("🔒 Авторизуйтесь.")
        user = dict(user_rec)
        if text == "📅 Расписание": await action_show_schedule_menu(update, context)
        elif text == "👥 Ученики": await action_show_students_list(update, context, user)
        elif text == "💰 Финансы": await action_show_finance_menu(update, context, user)
        elif text == "📉 Должники": await action_show_debtors(update, context, user)
        elif text == "⚙️ Настройки": await action_show_settings(update, context, user)
        elif text == "🏠 Главное меню": await action_show_main_menu(update, context, user, is_start=False)
        return

    if text == "📎 Справка":
        return await update.message.reply_text("📚 **Справка**\nЭтот бот синхронизирован с вашим сайтом. Все изменения (оплаты, отмены) сразу видны везде.", parse_mode='Markdown')

    if user_id in PENDING_LINK:
        user = await link_user_telegram(pool, text, user_id, update.effective_chat.id)
        if user: PENDING_LINK.remove(user_id); await update.message.reply_text("🎉 Готово! Аккаунт привязан.", reply_markup=main_reply_keyboard())
        else: await update.message.reply_text("❌ Email не найден.")

if __name__ == '__main__':
    if not TOKEN: exit(1)
    app = ApplicationBuilder().token(TOKEN).build()
    async def post_init(a): a.bot_data['pool'] = await get_db_pool(); print("Bot ready!")
    app.post_init = post_init
    app.add_handler(CommandHandler('start', start))
    app.add_handler(CallbackQueryHandler(check_sub_callback, pattern='^check_sub'))
    app.add_handler(CallbackQueryHandler(menu_callback, pattern='^menu_'))
    app.add_handler(CallbackQueryHandler(schedule_callback, pattern='^sched_'))
    app.add_handler(CallbackQueryHandler(lesson_details_callback, pattern='^lesson_'))
    app.add_handler(CallbackQueryHandler(student_details_callback, pattern='^student_'))
    app.add_handler(MessageHandler(filters.TEXT & (~filters.COMMAND), text_handler))
    app.run_polling()
