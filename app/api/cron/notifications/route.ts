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
            // Remind about lessons starting in the next 45 minutes
            const reminderWindowStart = now
            const reminderWindowEnd = new Date(now.getTime() + 45 * 60 * 1000)

            const upcomingLessons = await prisma.lesson.findMany({
                where: {
                    ownerId: userId,
                    date: {
                        gte: reminderWindowStart,
                        lte: reminderWindowEnd
                    },
                    isCanceled: false
                },
                include: { subject: true, student: true, group: true }
            })

            console.log(`CRON: Found ${upcomingLessons.length} upcoming lessons for reminder in next 45m for user ${userId}`)

            for (const lesson of upcomingLessons) {
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
                    const entityName = lesson.student?.name || lesson.group?.name || 'Ученик'
                    const entityLabel = lesson.studentId ? '👤 Ученик:' : '👥 Группа:'

                    // Format time in user's timezone
                    const timeString = new Intl.DateTimeFormat('ru-RU', {
                        hour: '2-digit',
                        minute: '2-digit',
                        timeZone: user.timezone || 'Europe/Moscow'
                    }).format(lesson.date)

                    const message = `🔔 **Скоро занятие**
                    
${entityLabel} ${entityName}
📚 Предмет: ${subjectName}
🕒 Время: ${timeString}
⏳ Длительность: ${lesson.duration} мин
💰 Стоимость: ${lesson.price} ₽
📝 Тема: ${lesson.topic || 'Не указана'}
`

                    // Always create notification record to prevent duplicates
                    await prisma.notification.create({
                        data: {
                            userId,
                            title: 'Скоро занятие',
                            message: `${subjectName} с ${lesson.studentId ? 'учеником' : 'группой'} ${entityName} в ${timeString}`,
                            type: 'lesson_reminder',
                            data: JSON.stringify({ key: notificationKey, lessonId: lesson.id }),
                            link: `/calendar?date=${lesson.date.toISOString().split('T')[0]}`,
                            isRead: !settings.deliveryWeb
                        }
                    })

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
                    const entityName = lesson.student?.name || lesson.group?.name || '---'
                    const entityLabel = lesson.studentId ? '👤 Ученик:' : '👥 Группа:'

                    const msg = `${entityLabel} **${entityName}**\n📚 Предмет: **${subjectName}**\n\nЗанятие завершилось, но не было оплачено. Не забудьте отметить оплату.`

                    // Always record to DB to avoid duplicates
                    await prisma.notification.create({
                        data: {
                            userId,
                            title: 'Неоплаченное занятие',
                            message: msg,
                            type: 'unpaid_lesson',
                            data: JSON.stringify({ key: notificationKey, lessonId: lesson.id }),
                            link: `/lessons?filter=unpaid`,
                            isRead: !settings.deliveryWeb
                        }
                    })

                    await sendTelegramNotification(userId, `💰 **Оплата:** ${msg}`, 'unpaidLessons')
                    notificationsCreated.push('unpaid')
                }
            }
        }

        // 3. Daily Income Report (End of day handled below in Evening Summary or here for raw stats)
        if (settings.incomeReports) {
            // Check if it's past 21:00 for simple report if summary is disabled
            if (now.getHours() >= 21) {
                const todayStr = now.toISOString().split('T')[0]
                const notificationKey = `income_daily_${todayStr}`

                const existing = await prisma.notification.findFirst({
                    where: { userId, type: 'income', data: { contains: notificationKey } }
                })

                if (!existing) {
                    const startOfDay = new Date(now)
                    startOfDay.setHours(0, 0, 0, 0)
                    const endOfDay = new Date(now)
                    endOfDay.setHours(23, 59, 59, 999)

                    const todayLessons = await prisma.lesson.findMany({
                        where: {
                            ownerId: userId,
                            date: { gte: startOfDay, lte: endOfDay },
                            isCanceled: false
                        },
                        include: { lessonPayments: true }
                    })

                    const income = todayLessons.reduce((sum, l) => {
                        if (l.studentId) return sum + (l.isPaid ? l.price : 0)
                        if (l.groupId) {
                            const paidCount = l.lessonPayments?.filter(p => p.hasPaid).length || 0
                            return sum + (paidCount * l.price)
                        }
                        return sum
                    }, 0)
                    if (todayLessons.length > 0) {
                        const msg = `Сегодня вы заработали ${income.toLocaleString('ru-RU')} ₽. Всего проведено занятий: ${todayLessons.length}.`
                        await prisma.notification.create({
                            data: {
                                userId,
                                title: 'Итоги дня',
                                message: msg,
                                type: 'income',
                                data: JSON.stringify({ key: notificationKey, date: todayStr }),
                                link: '/income',
                                isRead: !settings.deliveryWeb
                            }
                        })
                        await sendTelegramNotification(userId, `📊 **Итоги дня:**\n${msg}`, 'incomeReports')
                        notificationsCreated.push('daily_income')
                    }
                }
            }

            // Monthly Report
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
                        },
                        include: { lessonPayments: true }
                    })

                    const income = monthLessons.reduce((sum, l) => {
                        if (l.studentId) return sum + (l.isPaid ? l.price : 0)
                        if (l.groupId) {
                            const paidCount = l.lessonPayments?.filter(p => p.hasPaid).length || 0
                            return sum + (paidCount * l.price)
                        }
                        return sum
                    }, 0)
                    if (monthLessons.length > 0) {
                        const msg = `Итоги прошлого месяца: вы заработали ${income.toLocaleString('ru-RU')} ₽. Проведено занятий: ${monthLessons.length}.`
                        await prisma.notification.create({
                            data: {
                                userId,
                                title: 'Итоги месяца',
                                message: msg,
                                type: 'income',
                                data: JSON.stringify({ key: notificationKey }),
                                link: '/income',
                                isRead: !settings.deliveryWeb
                            }
                        })
                        await sendTelegramNotification(userId, `📅 **Итоги месяца:**\n${msg}`, 'incomeReports')
                        notificationsCreated.push('monthly_income')
                    }
                }
            }
        }

        // 4. Missing Lessons (Planning)
        if (settings.missingLessons) {
            if (now.getHours() >= 9 && now.getHours() <= 11) {
                const todayStr = now.toISOString().split('T')[0]
                const globalKey = `missing_check_${todayStr}`

                const checkDone = await prisma.notification.findFirst({
                    where: { userId, type: 'missing_lessons', data: { contains: globalKey } }
                })

                if (!checkDone) {
                    const students = await prisma.student.findMany({
                        where: { ownerId: userId },
                        include: {
                            lessons: { where: { date: { gte: now } }, take: 1 }
                        }
                    })

                    const studentsWithoutLessons = students.filter(s => s.lessons.length === 0)

                    for (const student of studentsWithoutLessons) {
                        const studentKey = `missing_lesson_student_${student.id}_week_${getWeekNumber(now)}`
                        const existing = await prisma.notification.findFirst({
                            where: { userId, type: 'missing_lessons', data: { contains: studentKey } }
                        })

                        if (!existing) {
                            const msg = `У ученика ${student.name} нет запланированных занятий. Самое время составить расписание!`
                            await prisma.notification.create({
                                data: {
                                    userId,
                                    title: 'Планирование занятий',
                                    message: msg,
                                    type: 'missing_lessons',
                                    data: JSON.stringify({ key: studentKey, studentId: student.id }),
                                    link: `/students/${student.id}`,
                                    isRead: !settings.deliveryWeb
                                }
                            })
                            await sendTelegramNotification(userId, `📅 **Планирование:** ${msg}`, 'missingLessons')
                            notificationsCreated.push('missing_lesson')
                        }
                    }
                }
            }
        }

        // 5. Student Debts
        if (settings.studentDebts && now.getDay() === 1 && now.getHours() >= 9 && now.getHours() <= 11) {
            const students = await prisma.student.findMany({
                where: { ownerId: userId },
                include: {
                    lessons: { where: { isPaid: false, isCanceled: false, date: { lt: now } } },
                    lessonPayments: {
                        where: { hasPaid: false, lesson: { isCanceled: false, date: { lt: now } } },
                        include: { lesson: true }
                    }
                }
            })

            for (const student of students) {
                const totalUnpaid = student.lessons.length + student.lessonPayments.length
                if (totalUnpaid >= 2) {
                    const totalDebtAmount = student.lessons.reduce((sum, l) => sum + l.price, 0) +
                        student.lessonPayments.reduce((sum, p) => sum + p.lesson.price, 0)

                    const key = `debt_student_${student.id}_week_${getWeekNumber(now)}`
                    const existing = await prisma.notification.findFirst({
                        where: { userId, type: 'debt', data: { contains: key } }
                    })

                    if (!existing) {
                        const msg = `👤 Ученик: **${student.name}**\nНакопилось ${totalUnpaid} неоплаченных занятий на сумму ${totalDebtAmount} ₽.`
                        await prisma.notification.create({
                            data: {
                                userId,
                                title: 'Задолженность у ученика',
                                message: `У ученика ${student.name} накоплено долгов на ${totalDebtAmount} ₽`,
                                type: 'debt',
                                data: JSON.stringify({ key }),
                                link: `/students/${student.id}`,
                                isRead: !settings.deliveryWeb
                            }
                        })
                        await sendTelegramNotification(userId, `📉 **Долги:**\n\n${msg}`, 'studentDebts')
                        notificationsCreated.push('student_debt')
                    }
                }
            }
        }

        // 6. Onboarding Tips
        if (settings.onboardingTips) {
            const isProfileComplete = !!(user.firstName && user.lastName && user.phone)
            if (!isProfileComplete) {
                const key = 'onboarding_profile'
                const existing = await prisma.notification.findFirst({
                    where: { userId, type: 'onboarding', data: { contains: key } }
                })
                if (!existing) {
                    const msg = 'Расскажите ученикам о себе! Добавьте фото и контактные данные в настройках профиля.'
                    await prisma.notification.create({
                        data: {
                            userId,
                            title: 'Заполните профиль',
                            message: msg,
                            type: 'onboarding',
                            data: JSON.stringify({ key }),
                            link: '/settings',
                            isRead: !settings.deliveryWeb
                        }
                    })
                    await sendTelegramNotification(userId, `👤 **Профиль:** ${msg}`, 'onboardingTips')
                    notificationsCreated.push('onboarding')
                }
            }
        }

        // 7. Morning Briefing & Evening Summary
        const userTz = user.timezone || 'Europe/Moscow'
        const startOfDay = new Date(now)
        startOfDay.setHours(0, 0, 0, 0)
        const endOfDay = new Date(now)
        endOfDay.setHours(23, 59, 59, 999)

        const todayLessons = await prisma.lesson.findMany({
            where: {
                ownerId: userId,
                date: { gte: startOfDay, lte: endOfDay },
                isCanceled: false
            },
            include: { subject: true, student: true, group: true, lessonPayments: true },
            orderBy: { date: 'asc' }
        })

        if (todayLessons.length > 0) {
            const todayStr = now.toISOString().split('T')[0]

            // Morning Briefing
            if (settings.morningBriefing) {
                const key = `morning_briefing_${todayStr}`
                const existing = await prisma.notification.findFirst({
                    where: { userId, type: 'morning_briefing', data: { contains: key } }
                })

                const firstLessonLimit = new Date(todayLessons[0].date.getTime() - 60 * 60 * 1000)
                const sevenAM = new Date(now)
                sevenAM.setHours(7, 0, 0, 0)
                const triggerTime = firstLessonLimit > sevenAM ? firstLessonLimit : sevenAM

                if (!existing && now >= triggerTime && now.getHours() < 12) {
                    const lessonsList = todayLessons.map((l, i) => {
                        const time = new Intl.DateTimeFormat('ru-RU', {
                            hour: '2-digit', minute: '2-digit', timeZone: userTz
                        }).format(l.date)
                        const label = l.studentId ? '👤' : '👥'
                        const name = l.student?.name || l.group?.name || '---'
                        return `${i + 1}. **${time}** ${label} ${name} (${l.subject?.name || 'Без предмета'})`
                    }).join('\n')

                    const msg = `☀️ **Доброе утро!**\n\nСегодня у вас ${todayLessons.length} занятий:\n\n${lessonsList}\n\nЖелаем удачного дня! ✨`
                    const sent = await sendTelegramNotification(userId, msg, 'morningBriefing')
                    if (sent) {
                        await prisma.notification.create({
                            data: {
                                userId, title: 'Утренний план', message: `У вас ${todayLessons.length} занятий сегодня.`,
                                type: 'morning_briefing', data: JSON.stringify({ key }), isRead: true
                            }
                        })
                        notificationsCreated.push('morning_briefing')
                    }
                }
            }

            // Evening Summary
            if (settings.eveningSummary) {
                const lastLesson = todayLessons[todayLessons.length - 1]
                const lastLessonEnd = new Date(lastLesson.date.getTime() + (lastLesson.duration || 60) * 60 * 1000)
                const summaryTime = new Date(lastLessonEnd.getTime() + 15 * 60 * 1000)

                if (now >= summaryTime) {
                    const key = `evening_summary_${todayStr}`
                    const existing = await prisma.notification.findFirst({
                        where: { userId, type: 'evening_summary', data: { contains: key } }
                    })

                    if (!existing) {
                        const incomeTotal = todayLessons.reduce((sum, l) => {
                            if (l.studentId) return sum + (l.isPaid ? l.price : 0)
                            if (l.groupId) {
                                const paidCount = l.lessonPayments?.filter(p => p.hasPaid).length || 0
                                return sum + (paidCount * l.price)
                            }
                            return sum
                        }, 0)
                        const msgText = `Сегодня вы заработали ${incomeTotal.toLocaleString('ru-RU')} ₽. Всего проведено занятий: ${todayLessons.length}.`
                        const msg = `🌟 **Отличная работа!**\n\n${msgText}\n\nХорошего отдыха! ✨`
                        const sent = await sendTelegramNotification(userId, msg, 'eveningSummary')
                        if (sent) {
                            await prisma.notification.create({
                                data: {
                                    userId, title: 'Итоги дня', message: `Вы провели ${todayLessons.length} занятий и заработали ${incomeTotal} ₽.`,
                                    type: 'evening_summary', data: JSON.stringify({ key }), isRead: true
                                }
                            })
                            notificationsCreated.push('evening_summary')
                        }
                    }
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
