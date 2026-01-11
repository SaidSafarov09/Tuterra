import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/jwt'
import { sendTelegramNotification } from '@/lib/telegram'

export const dynamic = 'force-dynamic'

function getWeekNumber(d: Date) {
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return weekNo;
}

async function processUserNotifications(userId: string) {
    const user = await prisma.user.findUnique({
        where: { id: userId }
    })

    if (!user) return { success: false, message: 'User not found' }

    const settings = await prisma.notificationSettings.upsert({
        where: { userId },
        create: { userId },
        update: {}
    })
    const now = new Date()
    const notificationsCreated = []
    const isStudent = user.role === 'student'
    const userTz = user.timezone || 'Europe/Moscow'

    // Local time info for the user
    const localHour = parseInt(new Intl.DateTimeFormat('en-GB', {
        hour: '2-digit', hour12: false, timeZone: userTz
    }).format(now))
    const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: userTz }).format(now)

    let studentIds: string[] = []
    if (isStudent) {
        const records = await prisma.student.findMany({
            where: { linkedUserId: userId },
            select: { id: true }
        })
        studentIds = records.map(r => r.id)
    }

    // 1. Lesson Reminders (45 min window)
    if (settings.lessonReminders) {
        const reminderWindowStart = now
        const reminderWindowEnd = new Date(now.getTime() + 45 * 60 * 1000)

        const upcomingLessons = await prisma.lesson.findMany({
            where: {
                ...(isStudent ? {
                    OR: [
                        { studentId: { in: studentIds } },
                        { group: { students: { some: { id: { in: studentIds } } } } }
                    ]
                } : {
                    ownerId: userId
                }),
                date: { gte: reminderWindowStart, lte: reminderWindowEnd },
                isCanceled: false
            },
            include: { subject: true, student: true, group: true, owner: true }
        })

        for (const lesson of upcomingLessons) {
            const notificationKey = `reminder_${lesson.id}`
            const existing = await prisma.notification.findFirst({
                where: { userId, type: 'lesson_reminder', data: { contains: notificationKey } }
            })

            if (!existing) {
                const subjectName = lesson.subject?.name || 'Занятие'
                const teacherName = lesson.owner?.firstName || lesson.owner?.name || 'Преподаватель'
                const entityName = isStudent ? teacherName : (lesson.student?.name || lesson.group?.name || 'Ученик')

                const timeStr = new Intl.DateTimeFormat('ru-RU', {
                    hour: '2-digit', minute: '2-digit', timeZone: userTz
                }).format(lesson.date)

                const message = isStudent
                    ? `🔔 **Напоминание о занятии**\n\n👨‍🏫 Преподаватель: ${teacherName}\n📚 Предмет: ${subjectName}\n🕒 Время: ${timeStr}`
                    : `🔔 **Скоро занятие**\n\n${lesson.studentId ? '👤 Ученик' : '👥 Группа'}: ${entityName}\n📚 Предмет: ${subjectName}\n🕒 Время: ${timeStr}\n⏳ Длительность: ${lesson.duration} мин`

                await prisma.notification.create({
                    data: {
                        userId,
                        title: 'Скоро занятие',
                        message: isStudent
                            ? `${subjectName} с преподавателем ${teacherName} начнется в ${timeStr}`
                            : `${subjectName} с ${lesson.studentId ? 'учеником' : 'группой'} ${entityName} начнется в ${timeStr}`,
                        type: 'lesson_reminder',
                        data: JSON.stringify({ key: notificationKey, lessonId: lesson.id }),
                        link: isStudent ? `/student/lessons/${lesson.id}` : `/lessons/${lesson.id}`,
                        isRead: !settings.deliveryWeb
                    }
                })
                await sendTelegramNotification(userId, message, 'lessonReminders')
                notificationsCreated.push('reminder')
            }
        }
    }

    // 2. Unpaid Lessons (Shortly after each lesson ends)
    if (settings.unpaidLessons) {
        const lookbackDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

        const unpaidLessons = await prisma.lesson.findMany({
            where: {
                ...(isStudent ? {
                    OR: [
                        { studentId: { in: studentIds } },
                        { group: { students: { some: { id: { in: studentIds } } } } }
                    ]
                } : {
                    ownerId: userId
                }),
                date: { gte: lookbackDate, lte: now },
                isPaid: false, isCanceled: false, price: { gt: 0 }
            },
            include: { subject: true, owner: true }
        })

        for (const lesson of unpaidLessons) {
            // Send notification only if lesson ended more than 5 minutes ago
            const lessonDurationMinutes = lesson.duration || 60
            const lessonEndTime = new Date(lesson.date.getTime() + lessonDurationMinutes * 60 * 1000)
            const triggerTime = new Date(lessonEndTime.getTime() + 5 * 60 * 1000)

            if (now < triggerTime) continue

            const notificationKey = `unpaid_${lesson.id}`
            const existing = await prisma.notification.findFirst({
                where: { userId, type: 'unpaid_lesson', data: { contains: notificationKey } }
            })

            if (!existing) {
                const teacherName = lesson.owner?.firstName || 'Преподаватель'
                const title = isStudent ? 'Ожидается оплата' : 'Неоплаченное занятие'
                const msg = isStudent
                    ? `У вас есть неоплаченное занятие по предмету ${lesson.subject?.name || '---'} у преподавателя ${teacherName}.`
                    : `Занятие завершилось, но не было оплачено. Не забудьте отметить оплату.`

                await prisma.notification.create({
                    data: {
                        userId, title, message: msg, type: 'unpaid_lesson',
                        data: JSON.stringify({ key: notificationKey, lessonId: lesson.id }),
                        link: isStudent ? '/student/lessons?tab=unpaid' : `/lessons?tab=unpaid`,
                        isRead: !settings.deliveryWeb
                    }
                })
                await sendTelegramNotification(userId, `💰 **Оплата:** ${msg}`, 'unpaidLessons')
                notificationsCreated.push('unpaid')
            }
        }
    }

    // 3. Teacher Only: Reports, Planning, Debts
    if (!isStudent) {
        const startOfDay = new Date(now); startOfDay.setHours(0, 0, 0, 0)
        const endOfDay = new Date(now); endOfDay.setHours(23, 59, 59, 999)

        const todayLessons = await prisma.lesson.findMany({
            where: { ownerId: userId, date: { gte: startOfDay, lte: endOfDay }, isCanceled: false },
            include: { subject: true, student: true, group: true, lessonPayments: true },
            orderBy: { date: 'asc' }
        })

        // Morning Briefing (7:00 - 12:00)
        if (settings.morningBriefing && todayLessons.length > 0 && localHour >= 7 && localHour < 12) {
            const key = `morning_briefing_${todayStr}`
            const existing = await prisma.notification.findFirst({
                where: { userId, type: 'morning_briefing', data: { contains: key } }
            })
            if (!existing) {
                const lessonsList = todayLessons.map((l, i) => {
                    const time = new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit', timeZone: userTz }).format(l.date)
                    return `${i + 1}. **${time}** ${l.studentId ? '👤' : '👥'} ${l.student?.name || l.group?.name} (${l.subject?.name || '---'})`
                }).join('\n')
                const msg = `☀️ **Доброе утро!**\n\nСегодня у вас ${todayLessons.length} занятий:\n\n${lessonsList}\n\nЖелаем удачного дня! ✨`
                if (await sendTelegramNotification(userId, msg, 'morningBriefing')) {
                    await prisma.notification.create({
                        data: {
                            userId, title: 'Утренний план', message: `У вас ${todayLessons.length} занятий сегодня.`,
                            type: 'morning_briefing', data: JSON.stringify({ key }), isRead: true, link: '/lessons?tab=upcoming'
                        }
                    })
                    notificationsCreated.push('morning_briefing')
                }
            }
        }

        // Daily Income Report (21:00+)
        if (settings.incomeReports && localHour >= 21) {
            const key = `income_daily_${todayStr}`
            const existing = await prisma.notification.findFirst({
                where: { userId, type: 'income', data: { contains: key } }
            })
            if (!existing && todayLessons.length > 0) {
                const income = todayLessons.reduce((sum, l) => {
                    if (l.studentId) return sum + (l.isPaid ? l.price : 0)
                    if (l.groupId) {
                        const paidCount = l.lessonPayments?.filter(p => p.hasPaid).length || 0
                        return sum + (paidCount * l.price)
                    }
                    return sum
                }, 0)
                const msgText = `Сегодня вы заработали ${income.toLocaleString('ru-RU')} ₽. Всего проведено занятий: ${todayLessons.length}.`
                await prisma.notification.create({
                    data: {
                        userId, title: 'Итоги дня', message: msgText, type: 'income',
                        data: JSON.stringify({ key, date: todayStr }), link: '/income', isRead: !settings.deliveryWeb
                    }
                })
                await sendTelegramNotification(userId, `📊 **Итоги дня:**\n${msgText}`, 'incomeReports')
                notificationsCreated.push('daily_income')
            }
        }

        // Evening Summary (After last lesson)
        if (settings.eveningSummary && todayLessons.length > 0) {
            const lastLesson = todayLessons[todayLessons.length - 1]
            const lastLessonEnd = new Date(lastLesson.date.getTime() + (lastLesson.duration || 60) * 60 * 1000)
            const summaryTime = new Date(lastLessonEnd.getTime() + 15 * 60 * 1000)

            if (now >= summaryTime) {
                const key = `evening_summary_${todayStr}`
                const existing = await prisma.notification.findFirst({
                    where: { userId, type: 'evening_summary', data: { contains: key } }
                })
                if (!existing) {
                    const income = todayLessons.reduce((sum, l) => {
                        if (l.studentId) return sum + (l.isPaid ? l.price : 0)
                        if (l.groupId) {
                            const paidCount = l.lessonPayments?.filter(p => p.hasPaid).length || 0
                            return sum + (paidCount * l.price)
                        }
                        return sum
                    }, 0)
                    const msg = `🌟 **Отличная работа!**\n\nСегодня проведено ${todayLessons.length} занятий, доход составил ${income.toLocaleString('ru-RU')} ₽.\n\nХорошего отдыха! ✨`
                    if (await sendTelegramNotification(userId, msg, 'eveningSummary')) {
                        await prisma.notification.create({
                            data: {
                                userId, title: 'Итоги дня', message: `Вы провели ${todayLessons.length} занятий.`,
                                type: 'evening_summary', data: JSON.stringify({ key }), isRead: true, link: '/income'
                            }
                        })
                        notificationsCreated.push('evening_summary')
                    }
                }
            }
        }

        // Planning Check & Debts (9:00 - 11:00)
        if (localHour >= 9 && localHour <= 11) {
            // Missing Lessons
            if (settings.missingLessons) {
                const globalKey = `missing_check_${todayStr}`
                const checkDone = await prisma.notification.findFirst({
                    where: { userId, type: 'missing_lessons', data: { contains: globalKey } }
                })
                if (!checkDone) {
                    const students = await prisma.student.findMany({
                        where: { ownerId: userId },
                        include: { lessons: { where: { date: { gte: now } }, take: 1 } }
                    })
                    for (const student of students.filter(s => s.lessons.length === 0)) {
                        const studentKey = `missing_student_${student.id}_week_${getWeekNumber(now)}`
                        const existing = await prisma.notification.findFirst({
                            where: { userId, type: 'missing_lessons', data: { contains: studentKey } }
                        })
                        if (!existing) {
                            const msg = `У ученика ${student.name} нет запланированных занятий. Самое время составить расписание!`
                            await prisma.notification.create({
                                data: {
                                    userId, title: 'Планирование', message: msg, type: 'missing_lessons',
                                    data: JSON.stringify({ key: studentKey }), link: `/students/${student.slug || student.id}`, isRead: !settings.deliveryWeb
                                }
                            })
                            await sendTelegramNotification(userId, `📅 **Планирование:** ${msg}`, 'missingLessons')
                        }
                    }
                }
            }

            // Student Debts (Mondays)
            if (settings.studentDebts && now.getDay() === 1) {
                const students = await prisma.student.findMany({
                    where: { ownerId: userId },
                    include: {
                        lessons: { where: { isPaid: false, isCanceled: false, date: { lt: now } } },
                        lessonPayments: { where: { hasPaid: false, lesson: { isCanceled: false, date: { lt: now } } }, include: { lesson: true } }
                    }
                })
                for (const student of students) {
                    const totalUnpaid = student.lessons.length + student.lessonPayments.length
                    if (totalUnpaid >= 2) {
                        const key = `debt_student_${student.id}_week_${getWeekNumber(now)}`
                        const existing = await prisma.notification.findFirst({
                            where: { userId, type: 'debt', data: { contains: key } }
                        })
                        if (!existing) {
                            const amount = student.lessons.reduce((sum, l) => sum + l.price, 0) + student.lessonPayments.reduce((sum, p) => sum + p.lesson.price, 0)
                            const msg = `У ученика ${student.name} накоплено ${totalUnpaid} долгов на ${amount} ₽.`
                            await prisma.notification.create({
                                data: {
                                    userId, title: 'Задолженность', message: msg, type: 'debt', data: JSON.stringify({ key }),
                                    link: `/students/${student.slug || student.id}`, isRead: !settings.deliveryWeb
                                }
                            })
                            await sendTelegramNotification(userId, `📉 **Долги:** ${msg}`, 'studentDebts')
                        }
                    }
                }
            }
        }
    }

    return { success: true, user: user.email, created: notificationsCreated }
}

export async function GET(request: NextRequest) {
    try {
        const secret = new URL(request.url).searchParams.get('secret')
        const cronSecret = process.env.CRON_SECRET

        if (cronSecret && secret === cronSecret) {
            const users = await prisma.user.findMany({
                select: { id: true }
            })
            const results = []
            for (const user of users) {
                results.push(await processUserNotifications(user.id))
            }
            return NextResponse.json({ mode: 'global', usersProcessed: users.length, results })
        }

        const token = request.cookies.get('auth-token')?.value
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        const payload = await verifyToken(token)
        if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const result = await processUserNotifications(payload.userId)
        return NextResponse.json({ mode: 'individual', ...result })
    } catch (error) {
        console.error('Cron job error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
