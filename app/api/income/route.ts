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

        // Calculate the range for all queries
        const rangeStart = startOfMonth(subMonths(currentDate, monthsCount - 1))
        const rangeEnd = endOfMonth(currentDate)

        const currentMonthStart = startOfMonth(currentDate)
        const currentMonthEnd = endOfMonth(currentDate)
        const prevMonthStart = startOfMonth(subMonths(currentDate, 1))
        const prevMonthEnd = endOfMonth(subMonths(currentDate, 1))

        // Single query for all lessons in the 6-month range
        const [allLessonsInRange, paidLessonsCount, currentMonthDurationResult, previousMonthDurationResult, debtsRaw] = await Promise.all([
            prisma.lesson.findMany({
                where: {
                    ownerId: user.id,
                    date: { gte: rangeStart, lte: rangeEnd },
                },
                include: {
                    group: { include: { students: true } },
                    lessonPayments: true,
                    student: {
                        select: {
                            name: true,
                            linkedUser: { select: { avatar: true } }
                        }
                    },
                    subject: { select: { name: true, color: true, icon: true } }
                }
            }),
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

        // Process data in-memory
        const monthlyStats = new Map<string, any>()
        // Initialize map for all months in range
        for (let i = 0; i < monthsCount; i++) {
            const date = subMonths(currentDate, i)
            const key = format(date, 'yyyy-MM')
            monthlyStats.set(key, {
                month: format(date, 'MMM', { locale: ru }),
                income: 0,
                lessons: 0,
                paid: 0,
                unpaid: 0,
                _date: date
            })
        }

        let currentIncome = 0
        let currentLessonsCount = 0
        let previousIncome = 0
        let previousLessonsCount = 0

        allLessonsInRange.forEach(lesson => {
            const monthKey = format(lesson.date, 'yyyy-MM')
            const stats = monthlyStats.get(monthKey)

            const isCurrentMonth = lesson.date >= currentMonthStart && lesson.date <= currentMonthEnd
            const isPrevMonth = lesson.date >= prevMonthStart && lesson.date <= prevMonthEnd

            let lessonIncome = 0
            let isLessonPaid = false

            if (lesson.group) {
                const totalStudents = lesson.group.students?.length || 0
                const paidPayments = lesson.lessonPayments?.filter(p => p.hasPaid).length || 0
                lessonIncome = paidPayments * lesson.price
                isLessonPaid = totalStudents > 0 && paidPayments >= totalStudents
            } else {
                if (lesson.isPaid) {
                    lessonIncome = lesson.price
                    isLessonPaid = true
                }
            }

            if (stats) {
                stats.income += lessonIncome
                stats.lessons++
                if (isLessonPaid) stats.paid++
                else stats.unpaid++
            }

            if (isCurrentMonth) {
                currentIncome += lessonIncome
                if (lessonIncome > 0) currentLessonsCount++
            } else if (isPrevMonth) {
                previousIncome += lessonIncome
                if (lessonIncome > 0) previousLessonsCount++
            }
        })

        const monthlyData = Array.from(monthlyStats.values())
            .sort((a, b) => a._date.getTime() - b._date.getTime())
            .map(({ _date, ...rest }) => rest)

        const recentTransactions = allLessonsInRange
            .filter(tx => tx.isPaid || (tx.lessonPayments && tx.lessonPayments.some(p => p.hasPaid)))
            .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
            .slice(0, 3)
            .map(tx => {
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
            averageCheck: currentLessonsCount > 0 ? Math.round(currentIncome / currentLessonsCount) : 0,
            previousAverageCheck: previousLessonsCount > 0 ? Math.round(previousIncome / previousLessonsCount) : 0,
            hasAnyIncomeEver: paidLessonsCount > 0,
            currentMonthDuration: (currentMonthDurationResult as any)._sum?.duration || 0,
            previousMonthDuration: (previousMonthDurationResult as any)._sum?.duration || 0,
            recentTransactions,
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
