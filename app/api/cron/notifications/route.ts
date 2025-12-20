import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/jwt'

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

        // 1. Lesson Reminders (30 min before)
        if (settings.lessonReminders) {
            // Target window: 25-35 minutes from now.
            // This prevents alerts happening too early (e.g. 45 mins before) or for lessons starting immediately.
            const twentyFiveMinsFromNow = new Date(now.getTime() + 25 * 60 * 1000)
            const thirtyFiveMinsFromNow = new Date(now.getTime() + 35 * 60 * 1000)

            const upcomingLessons = await prisma.lesson.findMany({
                where: {
                    ownerId: userId,
                    date: {
                        gte: twentyFiveMinsFromNow,
                        lte: thirtyFiveMinsFromNow
                    },
                    isCanceled: false
                },
                include: { subject: true, student: true, group: true }
            })

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
                    // Logic to check if it's exactly ~30 mins (or just within the window and not sent)
                    // Since we run this often, "within window and not sent" is good.
                    const subjectName = lesson.subject?.name || 'Занятие'
                    const studentName = lesson.student?.name || lesson.group?.name || 'Ученик'
                    const timeString = new Date(lesson.date).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })

                    await prisma.notification.create({
                        data: {
                            userId,
                            title: 'Скоро занятие',
                            message: `${subjectName} с ${studentName} начнется  в ${timeString}.`,
                            type: 'lesson_reminder',
                            data: JSON.stringify({ key: notificationKey, lessonId: lesson.id }),
                            link: `/calendar?date=${lesson.date.toISOString().split('T')[0]}` // Deep link to calendar
                        }
                    })
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

                    await prisma.notification.create({
                        data: {
                            userId,
                            title: 'Неоплаченное занятие',
                            message: `Занятие ${subjectName} с ${studentName} завершилось, но не было оплачено. Не забудьте отметить оплату.`,
                            type: 'unpaid_lesson',
                            data: JSON.stringify({ key: notificationKey, lessonId: lesson.id }),
                            link: `/lessons?filter=unpaid`
                        }
                    })
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
                    // Calculate today's income
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
                    const potentialIncome = todayLessons.reduce((sum, l) => sum + l.price, 0)

                    if (potentialIncome > 0) {
                        await prisma.notification.create({
                            data: {
                                userId,
                                title: 'Итоги дня',
                                message: `Сегодня вы заработали ${income.toLocaleString('ru-RU')} ₽. Всего проведено занятий: ${todayLessons.length}.`,
                                type: 'income',
                                data: JSON.stringify({ key: notificationKey, date: todayStr }),
                                link: '/income'
                            }
                        })
                        notificationsCreated.push('daily_income')
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
                        await prisma.notification.create({
                            data: {
                                userId,
                                title: 'Планирование занятий',
                                message: `У ученика ${student.name} нет запланированных занятий. Самое время составить расписание!`,
                                type: 'missing_lessons',
                                data: JSON.stringify({ key: studentKey, studentId: student.id }), // Key by week to remind once a week
                                link: `/students/${student.id}`
                            }
                        })
                        notificationsCreated.push('missing_lesson')
                    }
                }
            }
        }

        // 5. Onboarding (Profile)
        if (settings.onboardingTips) {
            // Check if profile is incomplete
            const isProfileComplete = user.firstName && user.lastName && user.phone
            if (!isProfileComplete) {
                const key = 'onboarding_profile'
                const existing = await prisma.notification.findFirst({ userId, type: 'onboarding', data: { contains: key } })

                if (!existing) {
                    await prisma.notification.create({
                        data: {
                            userId,
                            title: 'Заполните профиль',
                            message: 'Расскажите ученикам о себе! Добавьте фото и контактные данные в настройках профиля.',
                            type: 'onboarding',
                            data: JSON.stringify({ key }),
                            link: '/settings'
                        }
                    })
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
