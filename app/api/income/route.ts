import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns'
import { ru } from 'date-fns/locale'

export async function GET(request: NextRequest) {
    try {
        const user = await getCurrentUser(request)

        if (!user) {
            return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const dateParam = searchParams.get('date')
        const currentDate = dateParam ? new Date(dateParam) : new Date()
        const monthsCount = 6

        // Fetch monthly data in parallel
        const monthlyDataPromises = Array.from({ length: monthsCount }).map(async (_, index) => {
            const i = monthsCount - 1 - index
            const date = subMonths(currentDate, i)
            const monthStart = startOfMonth(date)
            const monthEnd = endOfMonth(date)

            const lessonsInMonth = await prisma.lesson.findMany({
                where: {
                    ownerId: user.id,
                    date: { gte: monthStart, lte: monthEnd },
                },
                include: {
                    group: { include: { students: true } },
                    lessonPayments: true
                }
            })

            let income = 0
            let paidCount = 0
            let unpaidCount = 0

            lessonsInMonth.forEach(lesson => {
                if (lesson.group) {
                    const totalStudents = lesson.group.students?.length || 0
                    const paidPayments = lesson.lessonPayments?.filter(p => p.hasPaid).length || 0
                    income += paidPayments * lesson.price

                    if (totalStudents > 0 && paidPayments >= totalStudents) {
                        paidCount++
                    } else {
                        unpaidCount++
                    }
                } else {
                    if (lesson.isPaid) {
                        income += lesson.price
                        paidCount++
                    } else {
                        unpaidCount++
                    }
                }
            })

            return {
                month: format(date, 'MMM', { locale: ru }),
                income,
                lessons: lessonsInMonth.length,
                paid: paidCount,
                unpaid: unpaidCount,
                _date: date
            }
        })

        const currentMonthStart = startOfMonth(currentDate)
        const currentMonthEnd = endOfMonth(currentDate)
        const prevMonthStart = startOfMonth(subMonths(currentDate, 1))
        const prevMonthEnd = endOfMonth(subMonths(currentDate, 1))

        const getMonthStats = async (start: Date, end: Date) => {
            const lessons = await prisma.lesson.findMany({
                where: {
                    ownerId: user.id,
                    date: { gte: start, lte: end },
                },
                include: {
                    group: { include: { students: true } },
                    lessonPayments: true
                }
            })

            let income = 0
            let lessonsCount = 0
            lessons.forEach(lesson => {
                if (lesson.group) {
                    const paidPayments = lesson.lessonPayments?.filter(p => p.hasPaid).length || 0
                    if (paidPayments > 0) {
                        income += paidPayments * lesson.price
                        lessonsCount++
                    }
                } else {
                    if (lesson.isPaid) {
                        income += lesson.price
                        lessonsCount++
                    }
                }
            })
            return { income, lessonsCount }
        }

        const [
            monthlyDataResults,
            currentStats,
            prevStats,
            paidLessonsCount,
            currentMonthDurationResult,
            previousMonthDurationResult,
            recentTransactions,
            debtsRaw
        ] = await Promise.all([
            Promise.all(monthlyDataPromises),
            getMonthStats(currentMonthStart, currentMonthEnd),
            getMonthStats(prevMonthStart, prevMonthEnd),
            prisma.lesson.count({
                where: {
                    ownerId: user.id,
                    OR: [
                        { isPaid: true },
                        { lessonPayments: { some: { hasPaid: true } } }
                    ]
                },
            }),
            prisma.lesson.aggregate({
                where: {
                    ownerId: user.id,
                    date: { gte: currentMonthStart, lte: currentMonthEnd },
                    isCanceled: false,
                },
                _sum: { duration: true } as any,
            }),
            prisma.lesson.aggregate({
                where: {
                    ownerId: user.id,
                    date: { gte: prevMonthStart, lte: prevMonthEnd },
                    isCanceled: false,
                },
                _sum: { duration: true } as any,
            }),
            prisma.lesson.findMany({
                where: {
                    ownerId: user.id,
                    date: { gte: currentMonthStart, lte: currentMonthEnd },
                    OR: [
                        { isPaid: true },
                        { lessonPayments: { some: { hasPaid: true } } }
                    ]
                },
                orderBy: { updatedAt: 'desc' },
                take: 3,
                include: {
                    student: {
                        select: {
                            name: true,
                            linkedUser: {
                                select: {
                                    avatar: true
                                }
                            }
                        }
                    },
                    subject: { select: { name: true, color: true, icon: true } },
                    group: { select: { name: true } },
                    lessonPayments: true,
                },
            }),
            prisma.lesson.findMany({
                where: {
                    ownerId: user.id,
                    isCanceled: false,
                    OR: [
                        { isPaid: false, groupId: null },
                        { lessonPayments: { some: { hasPaid: false } } }
                    ]
                },
                include: {
                    student: { select: { name: true } },
                    subject: { select: { name: true, color: true } },
                    group: { select: { name: true } },
                    lessonPayments: {
                        where: { hasPaid: false },
                        include: { student: { select: { name: true } } }
                    }
                },
                orderBy: { date: 'asc' }
            })
        ])

        const monthlyData = monthlyDataResults.sort((a, b) => (a as any)._date.getTime() - (b as any)._date.getTime())
            .map(({ _date, ...rest }) => rest)

        const currentIncome = currentStats.income
        const currentLessonsCount = currentStats.lessonsCount
        const averageCheck = currentLessonsCount > 0 ? Math.round(currentIncome / currentLessonsCount) : 0

        const previousIncome = prevStats.income
        const previousLessonsCount = prevStats.lessonsCount
        const previousAverageCheck = previousLessonsCount > 0 ? Math.round(previousIncome / previousLessonsCount) : 0

        const hasAnyIncomeEver = paidLessonsCount > 0

        const processedTransactions = recentTransactions.map(tx => {
            if (tx.group && tx.lessonPayments && tx.lessonPayments.length > 0) {
                const paidAmount = tx.lessonPayments.filter(p => p.hasPaid).length * tx.price
                return { ...tx, price: paidAmount }
            }
            return tx
        })

        const now = new Date()
        const debts: any[] = []

        debtsRaw.forEach(lesson => {
            const lessonEnd = new Date(lesson.date.getTime() + (lesson.duration || 60) * 60000)
            if (lessonEnd > now) return

            if (lesson.groupId) {
                if (lesson.lessonPayments.length > 0) {
                    lesson.lessonPayments.forEach(p => {
                        if (!p.hasPaid) {
                            debts.push({
                                id: `${lesson.id}-${p.studentId}`,
                                lessonId: lesson.id,
                                slug: lesson.slug,
                                studentName: p.student?.name || 'Неизвестно',
                                amount: lesson.price,
                                date: lesson.date,
                                isGroup: true,
                                groupName: lesson.group?.name,
                                subject: lesson.subject
                            })
                        }
                    })
                }
            } else if (!lesson.isPaid && lesson.student) {
                debts.push({
                    id: lesson.id,
                    lessonId: lesson.id,
                    slug: lesson.slug,
                    studentName: lesson.student.name,
                    amount: lesson.price,
                    date: lesson.date,
                    isGroup: false,
                    subject: lesson.subject
                })
            }
        })

        return NextResponse.json({
            monthlyData,
            currentMonthIncome: currentIncome,
            previousMonthIncome: previousIncome,
            currentLessonsCount,
            previousLessonsCount,
            averageCheck,
            previousAverageCheck,
            hasAnyIncomeEver,
            currentMonthDuration: (currentMonthDurationResult as any)._sum?.duration || 0,
            previousMonthDuration: (previousMonthDurationResult as any)._sum?.duration || 0,
            recentTransactions: processedTransactions,
            debts
        })
    } catch (error) {
        console.error('Get income stats error:', error)
        return NextResponse.json(
            { error: 'Произошла ошибка при получении статистики доходов' },
            { status: 500 }
        )
    }
}
