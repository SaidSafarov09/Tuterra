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


        const monthlyData = []

        for (let i = monthsCount - 1; i >= 0; i--) {
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
                    const lessonIncome = paidPayments * lesson.price

                    income += lessonIncome

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

            monthlyData.push({
                month: format(date, 'MMM', { locale: ru }),
                income,
                lessons: lessonsInMonth.length,
                paid: paidCount,
                unpaid: unpaidCount,
            })
        }

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
            let lessonsCount = 0 // Count of "Paid" lessons (or lessons with income?)
            // Usually "Lessons Count" in stats refers to Total Lessons or Paid Lessons?
            // In original code: `currentLessonsCount = currentMonthIncome._count` (which was filtered by isPaid=true).
            // So default behavior was counting PAID lessons.

            lessons.forEach(lesson => {
                if (lesson.group) {
                    const paidPayments = lesson.lessonPayments?.filter(p => p.hasPaid).length || 0
                    if (paidPayments > 0) {
                        income += paidPayments * lesson.price
                        // For count: should we count it if ANY payment? Or only full?
                        // Original was isPaid=true (so only fully paid in theory, but buggy).
                        // Let's count it if it generates income (has >0 payments).
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

        const currentStats = await getMonthStats(currentMonthStart, currentMonthEnd)
        const prevStats = await getMonthStats(prevMonthStart, prevMonthEnd)

        const currentIncome = currentStats.income
        const currentLessonsCount = currentStats.lessonsCount
        const averageCheck = currentLessonsCount > 0 ? Math.round(currentIncome / currentLessonsCount) : 0

        const previousIncome = prevStats.income
        const previousLessonsCount = prevStats.lessonsCount
        const previousAverageCheck = previousLessonsCount > 0 ? Math.round(previousIncome / previousLessonsCount) : 0


        const paidLessonsCount = await prisma.lesson.count({ // This is "all time paid lessons"
            where: {
                ownerId: user.id,
                OR: [
                    { isPaid: true },
                    { lessonPayments: { some: { hasPaid: true } } }
                ]
            },
        })
        const hasAnyIncomeEver = paidLessonsCount > 0


        const currentMonthDuration = await prisma.lesson.aggregate({
            where: {
                ownerId: user.id,
                date: { gte: currentMonthStart, lte: currentMonthEnd },
                isCanceled: false,
            },
            _sum: { duration: true } as any,
        })

        const previousMonthDuration = await prisma.lesson.aggregate({
            where: {
                ownerId: user.id,
                date: { gte: prevMonthStart, lte: prevMonthEnd },
                isCanceled: false,
            },
            _sum: { duration: true } as any,
        })


        const recentTransactions = await prisma.lesson.findMany({
            where: {
                ownerId: user.id,
                OR: [
                    { isPaid: true },
                    { lessonPayments: { some: { hasPaid: true } } }
                ]
            },
            orderBy: { updatedAt: 'desc' },
            take: 3,
            include: {
                student: { select: { name: true } },
                subject: { select: { name: true, color: true, icon: true } },
                group: { select: { name: true } },
                lessonPayments: true,
            },
        })

        const processedTransactions = recentTransactions.map(tx => {
            if (tx.group && tx.lessonPayments && tx.lessonPayments.length > 0) {
                const paidAmount = tx.lessonPayments.filter(p => p.hasPaid).length * tx.price
                return { ...tx, price: paidAmount }
            }
            return tx
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
            currentMonthDuration: (currentMonthDuration._sum as any)?.duration || 0,
            previousMonthDuration: (previousMonthDuration._sum as any)?.duration || 0,
            recentTransactions: processedTransactions,
        })
    } catch (error) {
        console.error('Get income stats error:', error)
        return NextResponse.json(
            { error: 'Произошла ошибка при получении статистики доходов' },
            { status: 500 }
        )
    }
}
