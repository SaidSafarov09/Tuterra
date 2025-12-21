import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/jwt'
import { sendTelegramNotification } from '@/lib/telegram'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    try {
        // Authenticate user (since we trigger this from client)
        const token = request.cookies.get('auth-token')?.value
        if (!token) {
            // Allow public cron trigger with a secret key if needed in future, 
            // but for now relying on user session is easier for "active user" checks.
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const payload = await verifyToken(token)
        if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const userId = payload.userId
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { notificationSettings: true }
        })

        if (!user || !user.notificationSettings) {
            return NextResponse.json({ success: true, message: 'No settings' })
        }

        const settings = user.notificationSettings
        const now = new Date()
        const notificationsCreated = []

        // 1. Lesson Reminders
        if (settings.lessonReminders) {
            // Check lessons starting in the next 24 hours (expanded for testing)
            // But usually 1 hour is enough. Let's use 6 hours to be safe.
            const searchEnd = new Date(now.getTime() + 6 * 60 * 60 * 1000)

            const upcomingLessons = await prisma.lesson.findMany({
                where: {
                    ownerId: userId,
                    date: {
                        gte: now,
                        lte: searchEnd
                    },
                    isCanceled: false
                },
                include: { subject: true, student: true, group: true }
            })

            console.log(`CRON: Found ${upcomingLessons.length} upcoming lessons for user ${userId}`)

            for (const lesson of upcomingLessons) {
                // Check if already notified
                // We use 'data' field to store structured info to avoid duplicates
                const notificationKey = `reminder_${lesson.id}`
                const existing = await prisma.notification.findFirst({
                    where: {
                        userId,
                        type: 'lesson_reminder',
                        data: { contains: notificationKey }
                    }
                })

                if (!existing) {
                    const subjectName = lesson.subject?.name || 'Занятие'
                    const studentName = lesson.student?.name || lesson.group?.name || 'Ученик'

                    // Format time in user's timezone
                    const timeString = new Intl.DateTimeFormat('ru-RU', {
                        hour: '2-digit',
                        minute: '2-digit',
                        timeZone: user.timezone || 'Europe/Moscow'
                    }).format(lesson.date)

                    const message = `🔔 **Скоро занятие**
                    
👤 Ученик: **${studentName}**
📚 Предмет: **${subjectName}**
🕒 Время: **${timeString}**
⏳ Длительность: **${lesson.duration} мин**
💰 Стоимость: **${lesson.price} ₽**
📝 Тема: **${lesson.topic || 'Не указана'}**`

                    if (settings.deliveryWeb) {
                        await prisma.notification.create({
                            data: {
                                userId,
                                title: 'Скоро занятие',
                                message: `${subjectName} с ${studentName} в ${timeString}`,
                                type: 'lesson_reminder',
                                data: JSON.stringify({ key: notificationKey, lessonId: lesson.id }),
                                link: `/calendar?date=${lesson.date.toISOString().split('T')[0]}`
                            }
                        })
                    }

                    console.log(`CRON: Sending reminder for lesson ${lesson.id} to user ${userId}`)
                    const sent = await sendTelegramNotification(userId, message, 'lessonReminders')
                    console.log(`CRON: Telegram send result: ${sent}`)
                    notificationsCreated.push('reminder')
                }
            }
        }

        // 2. Unpaid Lessons (Finished but not paid)
        if (settings.unpaidLessons) {
            // Check lessons ended in the last 7 days but at least 1 hour ago
            const daysLookup = 7
            const lookbackDate = new Date(now.getTime() - daysLookup * 24 * 60 * 60 * 1000)
            const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)

            const unpaidLessons = await prisma.lesson.findMany({
                where: {
                    ownerId: userId,
                    date: {
                        gte: lookbackDate,
                        lte: oneHourAgo
                    },
                    isPaid: false,
                    isCanceled: false,
                    price: { gt: 0 }
                },
                include: { subject: true, student: true, group: true }
            })

            for (const lesson of unpaidLessons) {
                const notificationKey = `unpaid_${lesson.id}`
                const existing = await prisma.notification.findFirst({
                    where: {
                        userId,
                        type: 'unpaid_lesson',
                        data: { contains: notificationKey }
                    }
                })

                if (!existing) {
                    const subjectName = lesson.subject?.name || 'Занятие'
                    const studentName = lesson.student?.name || lesson.group?.name || 'Ученик'

                    const msg = `Занятие ${subjectName} с ${studentName} завершилось, но не было оплачено. Не забудьте отметить оплату.`
                    if (settings.deliveryWeb) {
                        await prisma.notification.create({
                            data: {
                                userId,
                                title: 'Неоплаченное занятие',
                                message: msg,
                                type: 'unpaid_lesson',
                                data: JSON.stringify({ key: notificationKey, lessonId: lesson.id }),
                                link: `/lessons?filter=unpaid`
                            }
                        })
                    }
                    await sendTelegramNotification(userId, `💰 **Оплата:** ${msg}`, 'unpaidLessons')
                    notificationsCreated.push('unpaid')
                }
            }
        }

        // 3. Daily Income Report (End of day)
        if (settings.incomeReports) {
            // Check if it's past 21:00
            if (now.getHours() >= 21) {
                const todayStr = now.toISOString().split('T')[0]
                const notificationKey = `income_daily_${todayStr}`

                const existing = await prisma.notification.findFirst({
                    where: {
                        userId,
                        type: 'income',
                        data: { contains: notificationKey }
                    }
                })

                if (!existing) {
                    const todayStr = now.toISOString().split('T')[0]
                    const startOfDay = new Date(now)
                    startOfDay.setHours(0, 0, 0, 0)
                    const endOfDay = new Date(now)
                    endOfDay.setHours(23, 59, 59, 999)

                    const todayLessons = await prisma.lesson.findMany({
                        where: {
                            ownerId: userId,
                            date: { gte: startOfDay, lte: endOfDay },
                            isCanceled: false
                        }
                    })

                    const income = todayLessons.reduce((sum, l) => sum + (l.isPaid ? l.price : 0), 0)
                    if (todayLessons.length > 0) {
                        const msg = `Сегодня вы заработали ${income.toLocaleString('ru-RU')} ₽. Всего проведено занятий: ${todayLessons.length}.`
                        if (settings.deliveryWeb) {
                            await prisma.notification.create({
                                data: {
                                    userId,
                                    title: 'Итоги дня',
                                    message: msg,
                                    type: 'income',
                                    data: JSON.stringify({ key: notificationKey, date: todayStr }),
                                    link: '/income'
                                }
                            })
                        }
                        await sendTelegramNotification(userId, `📊 **Итоги дня:**\n${msg}`, 'incomeReports')
                        notificationsCreated.push('daily_income')
                    }
                }
            }

            // Monthly Report (on 1st day of month)
            if (now.getDate() === 1 && now.getHours() >= 9 && now.getHours() <= 11) {
                const monthStr = `${now.getFullYear()}-${now.getMonth() + 1}`
                const notificationKey = `income_monthly_${monthStr}`

                const existing = await prisma.notification.findFirst({
                    where: { userId, type: 'income', data: { contains: notificationKey } }
                })

                if (!existing) {
                    const startOfMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
                    const endOfMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)

                    const monthLessons = await prisma.lesson.findMany({
                        where: {
                            ownerId: userId,
                            date: { gte: startOfMonth, lte: endOfMonth },
                            isCanceled: false
                        }
                    })

                    const income = monthLessons.reduce((sum, l) => sum + (l.isPaid ? l.price : 0), 0)
                    if (monthLessons.length > 0) {
                        const msg = `Итоги прошлого месяца: вы заработали ${income.toLocaleString('ru-RU')} ₽. Проведено занятий: ${monthLessons.length}.`
                        if (settings.deliveryWeb) {
                            await prisma.notification.create({
                                data: {
                                    userId,
                                    title: 'Итоги месяца',
                                    message: msg,
                                    type: 'income',
                                    data: JSON.stringify({ key: notificationKey }),
                                    link: '/income'
                                }
                            })
                        }
                        await sendTelegramNotification(userId, `📅 **Итоги месяца:**\n${msg}`, 'incomeReports')
                        notificationsCreated.push('monthly_income')
                    }
                }
            }
        }

        // 4. Missing Lessons (Morning check)
        if (settings.missingLessons) {
            // Check at 9:00 - 11:00
            if (now.getHours() >= 9 && now.getHours() <= 11) {
                const todayStr = now.toISOString().split('T')[0]
                const notificationKey = `missing_check_${todayStr}` // Only check once a day globally

                // This check ensures we don't scan students repeatedly today
                const checkDone = await prisma.notification.findFirst({
                    where: {
                        userId,
                        type: 'missing_lessons',
                        data: { contains: notificationKey }
                    }
                })


                const students = await prisma.student.findMany({
                    where: { ownerId: userId },
                    include: {
                        lessons: {
                            where: { date: { gte: now } },
                            take: 1
                        }
                    }
                })

                const studentsWithoutLessons = students.filter(s => s.lessons.length === 0)

                for (const student of studentsWithoutLessons) {
                    const studentKey = `missing_lesson_student_${student.id}_week_${getWeekNumber(now)}`

                    const existing = await prisma.notification.findFirst({
                        where: {
                            userId,
                            type: 'missing_lessons',
                            data: { contains: studentKey }
                        }
                    })

                    if (!existing) {
                        const msg = `У ученика ${student.name} нет запланированных занятий. Самое время составить расписание!`
                        if (settings.deliveryWeb) {
                            await prisma.notification.create({
                                data: {
                                    userId,
                                    title: 'Планирование занятий',
                                    message: msg,
                                    type: 'missing_lessons',
                                    data: JSON.stringify({ key: studentKey, studentId: student.id }), // Key by week to remind once a week
                                    link: `/students/${student.id}`
                                }
                            })
                        }
                        await sendTelegramNotification(userId, `📅 **Планирование:** ${msg}`, 'missingLessons')
                        notificationsCreated.push('missing_lesson')
                    }
                }
            }
        }

        // 5. Student Debts (Once a week check on Mondays)
        if (settings.studentDebts) {
            // Only check on Monday (1)
            if (now.getDay() === 1) {
                const students = await prisma.student.findMany({
                    where: { ownerId: userId },
                    include: {
                        lessons: {
                            where: { isPaid: false, isCanceled: false, date: { lt: now } }
                        }
                    }
                })

                for (const student of students) {
                    const unpaidCount = student.lessons.length
                    if (unpaidCount >= 2) {
                        const debtAmount = student.lessons.reduce((sum, l) => sum + l.price, 0)
                        const key = `debt_student_${student.id}_week_${getWeekNumber(now)}`

                        const existing = await prisma.notification.findFirst({
                            where: { userId, type: 'debt', data: { contains: key } }
                        })

                        if (!existing) {
                            const msg = `У ученика ${student.name} накопилось ${unpaidCount} неоплаченных занятий на сумму ${debtAmount} ₽.`
                            if (settings.deliveryWeb) {
                                await prisma.notification.create({
                                    data: {
                                        userId,
                                        title: 'Задолженность у ученика',
                                        message: msg,
                                        type: 'debt',
                                        data: JSON.stringify({ key }),
                                        link: `/students/${student.id}`
                                    }
                                })
                            }
                            await sendTelegramNotification(userId, `📉 **Долги:** ${msg}`, 'studentDebts')
                            notificationsCreated.push('student_debt')
                        }
                    }
                }
            }
        }

        // 6. Onboarding (Profile)
        if (settings.onboardingTips) {
            // Check if profile is incomplete
            const isProfileComplete = user.firstName && user.lastName && user.phone
            if (!isProfileComplete) {
                const key = 'onboarding_profile'
                const existing = await prisma.notification.findFirst({
                    where: {
                        userId,
                        type: 'onboarding',
                        data: { contains: key }
                    }
                })

                if (!existing) {
                    const msg = 'Расскажите ученикам о себе! Добавьте фото и контактные данные в настройках профиля.'
                    if (settings.deliveryWeb) {
                        await prisma.notification.create({
                            data: {
                                userId,
                                title: 'Заполните профиль',
                                message: msg,
                                type: 'onboarding',
                                data: JSON.stringify({ key }),
                                link: '/settings'
                            }
                        })
                    }
                    await sendTelegramNotification(userId, `👤 **Профиль:** ${msg}`, 'onboardingTips')
                    notificationsCreated.push('onboarding')
                }
            }
        }

        return NextResponse.json({ success: true, created: notificationsCreated })
    } catch (error) {
        console.error('Cron job error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

function getWeekNumber(d: Date) {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    var weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return weekNo;
}
