import os
import asyncpg
from dotenv import load_dotenv
from datetime import datetime, timedelta
import pytz

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

async def get_db_pool():
    return await asyncpg.create_pool(DATABASE_URL)

async def get_user_by_telegram_id(pool, telegram_id):
    async with pool.acquire() as conn:
        return await conn.fetchrow('SELECT * FROM "User" WHERE "telegramId" = $1', str(telegram_id))

async def link_user_telegram(pool, email, telegram_id, chat_id):
    async with pool.acquire() as conn:
        user = await conn.fetchrow('SELECT * FROM "User" WHERE email = $1', email)
        if not user:
            return None
        await conn.execute(
            'UPDATE "User" SET "telegramId" = $1, "telegramChatId" = $2 WHERE email = $3',
            str(telegram_id), str(chat_id), email
        )
        # Enable Telegram delivery in settings
        await conn.execute(
            'UPDATE "NotificationSettings" SET "deliveryTelegram" = true WHERE "userId" = $1',
            user['id']
        )
        return user

async def verify_telegram_code(pool, code, telegram_id, chat_id):
    async with pool.acquire() as conn:
        print(f"DEBUG: Searching for code: {code}")
        # Find valid code
        record = await conn.fetchrow("""
            SELECT * FROM "VerificationCode" 
            WHERE code = $1 AND type = 'TELEGRAM_LINK'
        """, code)
        
        if not record:
            return None
            
        # Ensure timezone-aware comparison (DB returns naive UTC usually, or aware UTC)
        expires_at = record['expiresAt']
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=pytz.utc)
            
        now_utc = datetime.now(pytz.utc)
        
        if expires_at < now_utc:
             return None
        
        user_id = record['userId']
        
        # Link user
        await conn.execute("""
            UPDATE "User" SET "telegramId" = $1, "telegramChatId" = $2 WHERE id = $3
        """, str(telegram_id), str(chat_id), user_id)
        
        # Enable Telegram delivery in settings
        await conn.execute(
            'UPDATE "NotificationSettings" SET "deliveryTelegram" = true WHERE "userId" = $1',
            user_id
        )

        # Delete used code
        await conn.execute('DELETE FROM "VerificationCode" WHERE id = $1', record['id'])
        
        # Return user
        return await conn.fetchrow('SELECT * FROM "User" WHERE id = $1', user_id)

# --- Dashboard & Stats ---
async def get_dashboard_stats(pool, user_id, user_tz="Europe/Moscow"):
    async with pool.acquire() as conn:
        # Students count
        students = await conn.fetchval('SELECT COUNT(*) FROM "Student" WHERE "ownerId" = $1', user_id)
        
        # Today's lessons
        tz = pytz.timezone(user_tz)
        now_local = datetime.now(tz)
        today_start = now_local.replace(hour=0, minute=0, second=0, microsecond=0)
        today_end = today_start + timedelta(days=1)
        
        # Convert to UTC for DB query (Postgres TIMESTAMP is usually naive UTC)
        today_start_utc = today_start.astimezone(pytz.utc).replace(tzinfo=None)
        today_end_utc = today_end.astimezone(pytz.utc).replace(tzinfo=None)
        
        lessons_today = await conn.fetchval(
            'SELECT COUNT(*) FROM "Lesson" WHERE "ownerId" = $1 AND date >= $2 AND date < $3 AND "isCanceled" = false', 
            user_id, today_start_utc, today_end_utc
        )
        
        # Calculate income (sync with web app logic)
        sync_month_start = today_start.replace(day=1).astimezone(pytz.utc).replace(tzinfo=None)
        
        # Fetch lessons in current month
        lessons = await conn.fetch('''
            SELECT l.id, l.price, l."isPaid", l."groupId", l.date
            FROM "Lesson" l
            WHERE l."ownerId" = $1 
              AND l.date >= $2 
              AND l."isCanceled" = false
              AND (
                  l."isPaid" = true 
                  OR EXISTS (SELECT 1 FROM "LessonPayment" lp WHERE lp."lessonId" = l.id AND lp."hasPaid" = true)
              )
        ''', user_id, sync_month_start)
        
        income_month = 0
        income_today = 0
        
        for lesson in lessons:
            # Check if this lesson is today (using UTC comparison for simplicity or convert back)
            is_today = today_start_utc <= lesson['date'] < today_end_utc
            
            l_income = 0
            if lesson['groupId']:
                paid_count = await conn.fetchval(
                    'SELECT COUNT(*) FROM "LessonPayment" WHERE "lessonId" = $1 AND "hasPaid" = true',
                    lesson['id']
                )
                l_income = (paid_count or 0) * lesson['price']
            else:
                l_income = lesson['price']
            
            income_month += l_income
            if is_today:
                income_today += l_income
        
        return {
            "students": students,
            "lessons_today": lessons_today,
            "income": income_month,
            "income_today": income_today
        }

# --- Lessons ---
async def get_lessons_by_date(pool, user_id, date: datetime, user_tz="Europe/Moscow"):
    tz = pytz.timezone(user_tz)
    # Ensure date is local
    if date.tzinfo is None:
        date = tz.localize(date)
    
    start = date.replace(hour=0, minute=0, second=0, microsecond=0)
    end = start + timedelta(days=1)
    
    # Convert to UTC for DB
    start_utc = start.astimezone(pytz.utc).replace(tzinfo=None)
    end_utc = end.astimezone(pytz.utc).replace(tzinfo=None)
    
    async with pool.acquire() as conn:
        return await conn.fetch('''
            SELECT l.id, l.date, s.name as "subjectName", sg.name as "groupName", st.name as "studentName", 
                   l."groupId", l."studentId", l."isPaid", l."isCanceled", l.price
            FROM "Lesson" l
            LEFT JOIN "Subject" s ON l."subjectId" = s.id
            LEFT JOIN "Group" sg ON l."groupId" = sg.id
            LEFT JOIN "Student" st ON l."studentId" = st.id
            WHERE l."ownerId" = $1 AND l.date >= $2 AND l.date < $3
            ORDER BY l.date ASC
        ''', user_id, start_utc, end_utc)

async def get_lesson_by_id(pool, lesson_id):
    async with pool.acquire() as conn:
        return await conn.fetchrow('''
            SELECT l.*, s.name as "subjectName", st.name as "studentName", sg.name as "groupName"
            FROM "Lesson" l
            LEFT JOIN "Subject" s ON l."subjectId" = s.id
            LEFT JOIN "Student" st ON l."studentId" = st.id
            LEFT JOIN "Group" sg ON l."groupId" = sg.id
            WHERE l.id = $1
        ''', lesson_id)

async def get_group_lesson_payments(pool, lesson_id):
    async with pool.acquire() as conn:
        return await conn.fetch('''
            SELECT lp."studentId", st.name as "studentName", lp."hasPaid"
            FROM "LessonPayment" lp
            JOIN "Student" st ON lp."studentId" = st.id
            WHERE lp."lessonId" = $1
            ORDER BY st.name ASC
        ''', lesson_id)

async def toggle_lesson_paid(pool, lesson_id, status: bool):
    async with pool.acquire() as conn:
        # Update lesson status
        await conn.execute('UPDATE "Lesson" SET "isPaid" = $1 WHERE id = $2', status, lesson_id)
        # Also update LessonPayment if it's an individual lesson
        await conn.execute('''
            UPDATE "LessonPayment" 
            SET "hasPaid" = $1 
            WHERE "lessonId" = $2 AND "studentId" = (SELECT "studentId" FROM "Lesson" WHERE id = $2)
        ''', status, lesson_id)

async def toggle_student_payment(pool, lesson_id, student_id, status: bool):
    async with pool.acquire() as conn:
        await conn.execute('UPDATE "LessonPayment" SET "hasPaid" = $1 WHERE "lessonId" = $2 AND "studentId" = $3', status, lesson_id, student_id)

async def toggle_lesson_cancel(pool, lesson_id, status: bool):
    async with pool.acquire() as conn:
        await conn.execute('UPDATE "Lesson" SET "isCanceled" = $1 WHERE id = $2', status, lesson_id)

# --- Students ---
async def get_all_students(pool, user_id):
    async with pool.acquire() as conn:
        return await conn.fetch('SELECT * FROM "Student" WHERE "ownerId" = $1 ORDER BY name ASC', user_id)

async def get_student_details(pool, student_id):
    async with pool.acquire() as conn:
        student = await conn.fetchrow('SELECT * FROM "Student" WHERE id = $1', student_id)
        if not student: return None
        
        # Get subjects
        subjects = await conn.fetch('''
            SELECT s.name FROM "Subject" s
            INNER JOIN "_StudentToSubject" sts ON sts."B" = s.id
            WHERE sts."A" = $1
        ''', student_id)
        
        # Get groups
        groups = await conn.fetch('''
            SELECT g.name FROM "Group" g
            INNER JOIN "_GroupToStudent" gts ON gts."A" = g.id
            WHERE gts."B" = $1
        ''', student_id)
        
        # Stats
        total_lessons = await conn.fetchval('''
            SELECT COUNT(*) FROM (
                SELECT id FROM "Lesson" WHERE "studentId" = $1
                UNION ALL
                SELECT "lessonId" FROM "LessonPayment" WHERE "studentId" = $1
            ) as t
        ''', student_id)
        
        unpaid_count = await conn.fetchval('''
            SELECT COUNT(*) FROM (
                SELECT l.id FROM "Lesson" l 
                WHERE l."studentId" = $1 AND l."isPaid" = false AND l."isCanceled" = false AND l.date < NOW()
                UNION ALL
                SELECT lp."lessonId" FROM "LessonPayment" lp
                JOIN "Lesson" l ON lp."lessonId" = l.id
                WHERE lp."studentId" = $1 AND lp."hasPaid" = false AND l."isCanceled" = false AND l.date < NOW()
            ) as t
        ''', student_id)
        
        debt_amount = await conn.fetchval('''
            SELECT SUM(price) FROM (
                SELECT l.price FROM "Lesson" l
                WHERE l."studentId" = $1 AND l."isPaid" = false AND l."isCanceled" = false AND l.date < NOW()
                UNION ALL
                SELECT l.price FROM "LessonPayment" lp
                JOIN "Lesson" l ON lp."lessonId" = l.id
                WHERE lp."studentId" = $1 AND lp."hasPaid" = false AND l."isCanceled" = false AND l.date < NOW()
            ) as t
        ''', student_id)
        
        return {
            "info": dict(student),
            "subjects": [s['name'] for s in subjects],
            "groups": [g['name'] for g in groups],
            "stats": {
                "total": total_lessons or 0,
                "unpaid": unpaid_count or 0,
                "debt": debt_amount or 0
            }
        }

# --- Finance ---
async def get_unpaid_lessons(pool, user_id, limit=20):
    async with pool.acquire() as conn:
        return await conn.fetch('''
            SELECT * FROM (
                -- Individual lessons
                SELECT l.id, l.date, s.name as "subjectName", st.name as "studentName", 
                       NULL as "groupName", l."groupId", l.price, l."studentId"
                FROM "Lesson" l
                LEFT JOIN "Subject" s ON l."subjectId" = s.id
                LEFT JOIN "Student" st ON l."studentId" = st.id
                WHERE l."ownerId" = $1 
                  AND l."isPaid" = false 
                  AND l."isCanceled" = false 
                  AND l."studentId" IS NOT NULL
                  AND l."groupId" IS NULL
                  AND l.date < NOW()

                UNION ALL

                -- Group lesson payments
                SELECT l.id, l.date, s.name as "subjectName", st.name as "studentName", 
                       sg.name as "groupName", l."groupId", l.price, lp."studentId"
                FROM "LessonPayment" lp
                JOIN "Lesson" l ON lp."lessonId" = l.id
                JOIN "Student" st ON lp."studentId" = st.id
                LEFT JOIN "Subject" s ON l."subjectId" = s.id
                LEFT JOIN "Group" sg ON l."groupId" = sg.id
                WHERE l."ownerId" = $1
                  AND lp."hasPaid" = false
                  AND l."isCanceled" = false
                  AND l."groupId" IS NOT NULL
                  AND l.date < NOW()
            ) as unpaid
            ORDER BY date DESC
            LIMIT $2
        ''', user_id, limit)
