import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns'

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.id) {
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
                    ownerId: session.user.id,
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
                    ownerId: session.user.id,
                    isPaid: false,
                    date: {
                        gte: monthStart,
                        lte: monthEnd,
                    },
                },
                _count: true,
            })

            monthlyData.push({
                month: format(date, 'MMM', { locale: require('date-fns/locale/ru') }),
                income: paidLessons._sum.price || 0,
                lessons: (paidLessons._count || 0) + (unpaidLessons._count || 0),
                paid: paidLessons._count || 0,
                unpaid: unpaidLessons._count || 0,
            })
        }

        // Текущий месяц
        const currentMonthStart = startOfMonth(currentDate)
        const currentMonthEnd = endOfMonth(currentDate)

        const currentMonthIncome = await prisma.lesson.aggregate({
            where: {
                ownerId: session.user.id,
                isPaid: true,
                date: {
                    gte: currentMonthStart,
                    lte: currentMonthEnd,
                },
            },
            _sum: {
                price: true,
            },
        })

        // Предыдущий месяц
        const prevMonthStart = startOfMonth(subMonths(currentDate, 1))
        const prevMonthEnd = endOfMonth(subMonths(currentDate, 1))

        const previousMonthIncome = await prisma.lesson.aggregate({
            where: {
                ownerId: session.user.id,
                isPaid: true,
                date: {
                    gte: prevMonthStart,
                    lte: prevMonthEnd,
                },
            },
            _sum: {
                price: true,
            },
        })

        return NextResponse.json({
            monthlyData,
            currentMonthIncome: currentMonthIncome._sum.price || 0,
            previousMonthIncome: previousMonthIncome._sum.price || 0,
        })
    } catch (error) {
        console.error('Get income stats error:', error)
        return NextResponse.json(
            { error: 'Произошла ошибка при получении статистики доходов' },
            { status: 500 }
        )
    }
}
