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
        const monthsCount = 6 // Показываем 6 месяцев на графике

        // Получаем данные за последние N месяцев
        const monthlyData = []

        for (let i = monthsCount - 1; i >= 0; i--) {
            const date = subMonths(currentDate, i)
            const monthStart = startOfMonth(date)
            const monthEnd = endOfMonth(date)

            // Оплаченные занятия
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

            // Неоплаченные занятия
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

        // Предыдущий месяц
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

        // Проверяем, есть ли вообще хоть один оплаченный урок за все время
        const paidLessonsCount = await prisma.lesson.count({
            where: {
                ownerId: user.id,
                isPaid: true,
            },
        })
        const hasAnyIncomeEver = paidLessonsCount > 0

        return NextResponse.json({
            monthlyData,
            currentMonthIncome: currentIncome,
            previousMonthIncome: previousIncome,
            currentLessonsCount,
            previousLessonsCount,
            averageCheck,
            previousAverageCheck,
            hasAnyIncomeEver,
        })
    } catch (error) {
        console.error('Get income stats error:', error)
        return NextResponse.json(
            { error: 'Произошла ошибка при получении статистики доходов' },
            { status: 500 }
        )
    }
}
