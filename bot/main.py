import logging
import os
import asyncio
from datetime import datetime, timedelta
import pytz
from dotenv import load_dotenv
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, ReplyKeyboardMarkup, ReplyKeyboardRemove
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
CHANNEL_ID = os.getenv("TELEGRAM_CHANNEL_ID", "@tuterra_news") # Make sure to set this in .env or change default
PENDING_LINK = set()

# --- Helpers ---
async def check_subscription(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_user.id
    try:
        # Check if user is member/admin/creator/restricted
        member = await context.bot.get_chat_member(chat_id=CHANNEL_ID, user_id=user_id)
        if member.status in ['left', 'kicked']:
            return False
        return True
    except Exception as e:
        # If bot is not admin in channel, or channel invalid, default to True to not block
        logging.error(f"Subscription check error: {e}")
        return True

def to_local_time(dt, zone="Europe/Moscow"):
    if not dt:
        return None
    if dt.tzinfo is None:
        dt = pytz.utc.localize(dt)
    try:
        tz = pytz.timezone(zone)
    except:
        tz = pytz.timezone("Europe/Moscow")
    return dt.astimezone(tz)

async def send_subscription_wall(update: Update):
    channel_url = f"https://t.me/{CHANNEL_ID.replace('@', '')}"
    keyboard = [
        [InlineKeyboardButton("📢 Подписаться на канал", url=channel_url)],
        [InlineKeyboardButton("✅ Я подписался", callback_data='check_sub')]
    ]
    text = (
        "🔒 **Доступ ограничен**\n\n"
        "Чтобы пользоваться ботом и получать уведомления, "
        "пожалуйста, подпишитесь на наш канал новостей."
    )
    
    if update.callback_query:
        # Try edit, if content same it might throw, so ignore
        try:
             await update.callback_query.edit_message_text(text, reply_markup=InlineKeyboardMarkup(keyboard), parse_mode='Markdown')
        except:
             await update.callback_query.answer("Подпишитесь на канал!", show_alert=True)
    else:
        await update.message.reply_text(text, reply_markup=InlineKeyboardMarkup(keyboard), parse_mode='Markdown')

# --- Keyboards ---
def main_menu_keyboard():
    keyboard = [
        [InlineKeyboardButton("📅 Расписание", callback_data='menu_schedule'),
         InlineKeyboardButton("👥 Ученики", callback_data='menu_students')],
        [InlineKeyboardButton("💰 Финансы", callback_data='menu_finance'),
         InlineKeyboardButton("⚙️ Настройки", callback_data='menu_settings')]
    ]
    return InlineKeyboardMarkup(keyboard)

def back_button(data='menu_main'):
    return InlineKeyboardButton("🔙 Назад", callback_data=data)

# --- Handlers ---

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_user.id
    pool = context.bot_data['pool']
    
    # Check Subscription first
    if not await check_subscription(update, context):
        await send_subscription_wall(update)
        return

    # 1. Broadly check for deep linking arguments
    if context.args and len(context.args) > 0:
        code = context.args[0]
        linked_user = await verify_telegram_code(pool, code, user_id, update.effective_chat.id)
        if linked_user:
            await update.message.reply_text(f"🚀 Аккаунт **{linked_user['email']}** успешно привязан!", parse_mode='Markdown')
        else:
             await update.message.reply_text("❌ Неверный или истекший код привязки.")

    # 2. Normal Auth Check
    user = await get_user_by_telegram_id(pool, user_id)
    
    if user:
        user_tz = user.get('timezone', 'Europe/Moscow')
        stats = await get_dashboard_stats(pool, user['id'], user_tz)
        text = (
            f"👋 Привет, {user['firstName'] or 'Преподаватель'}!\n\n"
            f"📊 **Сводка:**\n"
            f"• Учеников: {stats['students']}\n"
            f"• Уроков сегодня: {stats['lessons_today']}\n"
            f"• Доход за месяц: {stats['income']} ₽\n\n"
            "Что будем делать?"
        )
        await update.message.reply_text(text, reply_markup=main_menu_keyboard(), parse_mode='Markdown')
    else:
        await update.message.reply_text(
            "🔒 **Требуется авторизация**\n\n"
            "Вы можете привязать аккаунт двумя способами:\n"
            "1. Перейдите по ссылке из настроек на сайте (рекомендуется).\n"
            "2. Отправьте мне свой **Email** прямо здесь.",
            parse_mode='Markdown'
        )
        PENDING_LINK.add(user_id)

async def check_sub_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    
    if await check_subscription(update, context):
        await query.answer("Спасибо за подписку! 🎉")
        # Proceed to main menu logic
        # Retrieve user to show main menu
        pool = context.bot_data['pool']
        user_id = update.effective_user.id
        user = await get_user_by_telegram_id(pool, user_id)
        
        if user:
            user_tz = user.get('timezone', 'Europe/Moscow')
            stats = await get_dashboard_stats(pool, user['id'], user_tz)
            text = (
                f"👋 Привет, {user['firstName'] or 'Преподаватель'}!\n\n"
                f"📊 **Сводка:**\n"
                f"• Учеников: {stats['students']}\n"
                f"• Уроков сегодня: {stats['lessons_today']}\n"
                f"• Доход за месяц: {stats['income']} ₽"
            )
            await query.edit_message_text(text, reply_markup=main_menu_keyboard(), parse_mode='Markdown')
        else:
             await query.edit_message_text(
                "🔒 **Требуется авторизация**\n\nПривяжите аккаунт через настройки на сайте.",
                parse_mode='Markdown'
            )
    else:
        await query.answer("Вы все еще не подписаны 😢", show_alert=True)

async def menu_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    # Check Sub
    if not await check_subscription(update, context):
        await send_subscription_wall(update)
        return

    await query.answer()
    
    data = query.data
    pool = context.bot_data['pool']
    user_id = update.effective_user.id
    user = await get_user_by_telegram_id(pool, user_id) 
    
    if not user:
        await query.edit_message_text("Ошибка авторизации. Введите /start")
        return

    if data == 'menu_main':
        user_tz = user.get('timezone', 'Europe/Moscow')
        stats = await get_dashboard_stats(pool, user['id'], user_tz)
        text = (
            f"👋 Привет, {user['firstName'] or 'Преподаватель'}!\n\n"
            f"📊 **Сводка:**\n"
            f"• Учеников: {stats['students']}\n"
            f"• Уроков сегодня: {stats['lessons_today']}\n"
            f"• Доход за месяц: {stats['income']} ₽"
        )
        await query.edit_message_text(text, reply_markup=main_menu_keyboard(), parse_mode='Markdown')

    elif data == 'menu_schedule':
        keyboard = [
            [InlineKeyboardButton("Сегодня", callback_data='sched_today'),
             InlineKeyboardButton("Завтра", callback_data='sched_tomorrow')],
            [back_button()]
        ]
        await query.edit_message_text("📅 **Выберите день:**", reply_markup=InlineKeyboardMarkup(keyboard), parse_mode='Markdown')

    elif data == 'menu_students':
        students = await get_all_students(pool, user['id'])
        if not students:
             await query.edit_message_text("У вас пока нет учеников.", reply_markup=InlineKeyboardMarkup([[back_button()]]))
             return

        keyboard = []
        for s in students[:10]: 
            keyboard.append([InlineKeyboardButton(s['name'], callback_data=f"student_{s['id']}")])
        
        keyboard.append([back_button()])
        await query.edit_message_text("👥 **Ваши ученики:**", reply_markup=InlineKeyboardMarkup(keyboard), parse_mode='Markdown')

    elif data == 'menu_finance':
        unpaid = await get_unpaid_lessons(pool, user['id'], limit=5)
        text = "💰 **Финансы**\n\n"
        
        if unpaid:
            text += "⚠️ **Неоплаченные уроки:**\n"
            keyboard = []
            user_tz = user.get('timezone', 'Europe/Moscow')
            for l in unpaid:
                local_date = to_local_time(l['date'], user_tz)
                date_str = local_date.strftime("%d.%m")
                label = f"{date_str} {l['studentName']} ({l['price']}₽)"
                keyboard.append([InlineKeyboardButton(label, callback_data=f"lesson_{l['id']}")])
            
            keyboard.append([back_button()])
            await query.edit_message_text(text, reply_markup=InlineKeyboardMarkup(keyboard), parse_mode='Markdown')
        else:
             text += "Все уроки оплачены! 🎉"
             await query.edit_message_text(text, reply_markup=InlineKeyboardMarkup([[back_button()]]), parse_mode='Markdown')

    elif data == 'menu_settings':
         await query.edit_message_text(
             "⚙️ **Настройки**\n\n"
             f"Привязанный Email: {user['email']}\n"
             "Уведомления: Включены ✅",
             reply_markup=InlineKeyboardMarkup([[back_button()]]),
             parse_mode='Markdown'
         )

async def schedule_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    
    if not await check_subscription(update, context):
        await send_subscription_wall(update)
        return

    await query.answer()
    data = query.data
    user_rec = await get_user_by_telegram_id(pool, user_id)
    if not user_rec:
        await query.edit_message_text("Ошибка авторизации")
        return

    user_tz = user_rec.get('timezone', 'Europe/Moscow')
    tz = pytz.timezone(user_tz)
    local_now = datetime.now(tz)
    
    target_date = local_now
    title = "Сегодня"
    
    if data == 'sched_tomorrow':
        target_date += timedelta(days=1)
        title = "Завтра"

    lessons = await get_lessons_by_date(pool, user_rec['id'], target_date, user_tz)
    
    if not lessons:
        await query.edit_message_text(
            f"📅 **{title}:** Занятий нет. Отдыхаем! 🏖", 
            reply_markup=InlineKeyboardMarkup([[back_button('menu_schedule')]]),
            parse_mode='Markdown'
        )
        return

    text = f"📅 **Расписание на {title} ({to_local_time(target_date, user_rec.get('timezone', 'Europe/Moscow')).strftime('%d.%m')}):**\n\n"
    keyboard = []
    
    user_tz = user_rec.get('timezone', 'Europe/Moscow')
    for l in lessons:
        local_date = to_local_time(l['date'], user_tz)
        time_str = local_date.strftime("%H:%M")
        subj = l['subjectName'] or "Урок"
        student = l['studentName'] or l['groupName'] or "Ученик"
        status_icon = "✅" if l['isPaid'] else "⚠️"
        if l['isCanceled']: status_icon = "❌"
        
        btn_text = f"{status_icon} {time_str} - {student} ({subj})"
        keyboard.append([InlineKeyboardButton(btn_text, callback_data=f"lesson_{l['id']}")])
    
    keyboard.append([back_button('menu_schedule')])
    await query.edit_message_text(text, reply_markup=InlineKeyboardMarkup(keyboard), parse_mode='Markdown')

async def lesson_details_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    
    if not await check_subscription(update, context):
        await send_subscription_wall(update)
        return

    lesson_id = query.data.split('_')[1]
    pool = context.bot_data['pool']
    
    # Check manual actions
    action = None
    if len(query.data.split('_')) > 2:
        action = query.data.split('_')[2]
        if action == 'pay':
            await toggle_lesson_paid(pool, lesson_id, True)
            await query.answer("Отмечено оплаченным ✅")
        elif action == 'unpay':
            await toggle_lesson_paid(pool, lesson_id, False)
            await query.answer("Отмечено неоплаченным ⚠️")

    lesson = await get_lesson_by_id(pool, lesson_id)
    if not lesson:
        await query.answer("Урок не найден", show_alert=True)
        return

    if action == 'togglecancel':
        new_status = not lesson['isCanceled']
        await toggle_lesson_cancel(pool, lesson_id, new_status)
        lesson = dict(lesson) 
        lesson['isCanceled'] = new_status
        await query.answer("Статус отмены изменен")

    # Retrieve user to get timezone
    user_id = update.effective_user.id
    user_rec = await get_user_by_telegram_id(pool, user_id)
    user_tz = user_rec.get('timezone', 'Europe/Moscow') if user_rec else 'Europe/Moscow'

    # Build view
    local_date = to_local_time(lesson['date'], user_tz)
    time_str = local_date.strftime("%d.%m.%Y %H:%M")
    subj = lesson['subjectName'] or "Без предмета"
    student = lesson['studentName'] or lesson['groupName'] or "Ученик"
    price = lesson['price']
    
    status_text = []
    if lesson['isCanceled']: status_text.append("❌ ОТМЕНЕНО")
    if lesson['isPaid']: status_text.append("✅ ОПЛАЧЕНО")
    else: status_text.append("⚠️ НЕ ОПЛАЧЕНО")
    
    text = (
        f"📚 **Информация об уроке**\n\n"
        f"📅 Дата: **{time_str}**\n"
        f"👨‍🎓 Ученик: **{student}**\n"
        f"📖 Предмет: **{subj}**\n"
        f"💰 Стоимость: **{price} ₽**\n"
        f"📊 Статус: {' '.join(status_text)}"
    )
    
    btns = []
    if not lesson['isCanceled']:
        if lesson['isPaid']:
            btns.append(InlineKeyboardButton("↩️ Отменить оплату", callback_data=f"lesson_{lesson_id}_unpay"))
        else:
            btns.append(InlineKeyboardButton("✅ Отметить оплаченным", callback_data=f"lesson_{lesson_id}_pay"))
            
    cancel_text = "Восстановить урок" if lesson['isCanceled'] else "❌ Отменить урок"
    btns.append(InlineKeyboardButton(cancel_text, callback_data=f"lesson_{lesson_id}_togglecancel"))
    
    keyboard = [
        btns,
        [back_button('menu_schedule')]
    ]
    
    await query.edit_message_text(text, reply_markup=InlineKeyboardMarkup(keyboard), parse_mode='Markdown')


async def text_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_user.id
    
    if not await check_subscription(update, context):
        await send_subscription_wall(update)
        return

    text = update.message.text.strip()
    pool = context.bot_data['pool']
    
    if user_id in PENDING_LINK:
        user = await link_user_telegram(pool, text, user_id, update.effective_chat.id)
        if user:
            PENDING_LINK.remove(user_id)
            await update.message.reply_text("🎉 Аккаунт успешно привязан!", reply_markup=main_menu_keyboard())
        else:
            await update.message.reply_text("❌ Email не найден. Попробуй еще раз.")

if __name__ == '__main__':
    if not TOKEN:
        print("Error: TELEGRAM_BOT_TOKEN not found")
        exit(1)

    app = ApplicationBuilder().token(TOKEN).build()
    
    async def post_init(application):
        application.bot_data['pool'] = await get_db_pool()
        print("Bot ready!")

    app.post_init = post_init

    app.add_handler(CommandHandler('start', start))
    
    app.add_handler(CallbackQueryHandler(check_sub_callback, pattern='^check_sub'))
    app.add_handler(CallbackQueryHandler(menu_callback, pattern='^menu_'))
    app.add_handler(CallbackQueryHandler(schedule_callback, pattern='^sched_'))
    app.add_handler(CallbackQueryHandler(lesson_details_callback, pattern='^lesson_'))
    
    app.add_handler(MessageHandler(filters.TEXT & (~filters.COMMAND), text_handler))
    
    app.run_polling()
