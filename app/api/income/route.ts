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


            const paidLessons = await prisma.lesson.aggregate({
                where: {
                    ownerId: user.id,
                    isPaid: true,
                    date: {
                        gte: monthStart,
                        lte: monthEnd,
                    },
                },
                _sum: {
                    price: true,
                },
                _count: true,
            })


            const unpaidLessons = await prisma.lesson.aggregate({
                where: {
                    ownerId: user.id,
                    isPaid: false,
                    date: {
                        gte: monthStart,
                        lte: monthEnd,
                    },
                },
                _count: true,
            })

            monthlyData.push({
                month: format(date, 'MMM', { locale: ru }),
                income: paidLessons._sum.price || 0,
                lessons: (paidLessons._count || 0) + (unpaidLessons._count || 0),
                paid: paidLessons._count || 0,
                unpaid: unpaidLessons._count || 0,
            })
        }

        const currentMonthStart = startOfMonth(currentDate)
        const currentMonthEnd = endOfMonth(currentDate)

        const currentMonthIncome = await prisma.lesson.aggregate({
            where: {
                ownerId: user.id,
                isPaid: true,
                date: {
                    gte: currentMonthStart,
                    lte: currentMonthEnd,
                },
            },
            _sum: {
                price: true,
            },
            _count: true,
        })


        const prevMonthStart = startOfMonth(subMonths(currentDate, 1))
        const prevMonthEnd = endOfMonth(subMonths(currentDate, 1))

        const previousMonthIncome = await prisma.lesson.aggregate({
            where: {
                ownerId: user.id,
                isPaid: true,
                date: {
                    gte: prevMonthStart,
                    lte: prevMonthEnd,
                },
            },
            _sum: {
                price: true,
            },
            _count: true,
        })

        const currentIncome = currentMonthIncome._sum.price || 0
        const currentLessonsCount = currentMonthIncome._count || 0
        const averageCheck = currentLessonsCount > 0 ? Math.round(currentIncome / currentLessonsCount) : 0

        const previousIncome = previousMonthIncome._sum.price || 0
        const previousLessonsCount = previousMonthIncome._count || 0
        const previousAverageCheck = previousLessonsCount > 0 ? Math.round(previousIncome / previousLessonsCount) : 0


        const paidLessonsCount = await prisma.lesson.count({
            where: {
                ownerId: user.id,
                isPaid: true,
            },
        })
        const hasAnyIncomeEver = paidLessonsCount > 0


        const currentMonthDuration = await prisma.lesson.aggregate({
            where: {
                ownerId: user.id,
                isPaid: true,
                date: { gte: currentMonthStart, lte: currentMonthEnd },
            },
            _sum: { duration: true } as any,
        })

        const previousMonthDuration = await prisma.lesson.aggregate({
            where: {
                ownerId: user.id,
                isPaid: true,
                date: { gte: prevMonthStart, lte: prevMonthEnd },
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
