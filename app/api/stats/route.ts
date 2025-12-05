import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/jwt'
import { prisma } from '@/lib/prisma'
import { startOfMonth, endOfMonth } from 'date-fns'

export async function GET(request: NextRequest) {
    try {
        const token = request.cookies.get('auth-token')?.value
        if (!token) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })

        const payload = await verifyToken(token)
        if (!payload) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })

        const now = new Date()
        const monthStart = startOfMonth(now)
        const monthEnd = endOfMonth(now)

        // Получаем статистику параллельно
        const [studentsCount, upcomingLessons, unpaidLessons, monthlyIncome, totalLessons, subjectsCount, userProfile] = await Promise.all([
            // Количество учеников
            prisma.student.count({
                where: { ownerId: payload.userId },
            }),

            // Ближайшие занятия
            prisma.lesson.findMany({
                where: {
                    ownerId: payload.userId,
                    date: { gte: now },
                    isCanceled: false,
                } as any,
                include: {
                    student: true,
                    subject: true,
                },
                orderBy: { date: 'asc' },
                take: 5,
            }),

            // Неоплаченные занятия
            prisma.lesson.findMany({
                where: {
                    ownerId: payload.userId,
                    isPaid: false,
                    isCanceled: false,
                } as any,
                include: {
                    student: true,
                    subject: true,
                },
                orderBy: { date: 'desc' },
            }),

            // Доход за текущий месяц
            prisma.lesson.aggregate({
                where: {
                    ownerId: payload.userId,
                    isPaid: true,
                    date: {
                        gte: monthStart,
                        lte: monthEnd,
                    },
                } as any,
                _sum: {
                    price: true,
                },
            }),

            // Всего проведенных занятий (прошедшие)
            prisma.lesson.count({
                where: {
                    ownerId: payload.userId,
                    date: { lte: now },
                    isCanceled: false,
                } as any,
            }),

            // Количество предметов
            prisma.subject.count({
                where: { userId: payload.userId },
            }),

            // Дата регистрации пользователя
            prisma.user.findUnique({
                where: { id: payload.userId },
                select: { createdAt: true },
            }),
        ])

        return NextResponse.json({
            studentsCount,
            upcomingLessons,
            unpaidLessons,
            monthlyIncome: monthlyIncome._sum?.price || 0,
            totalLessons,
            subjectsCount,
            createdAt: userProfile?.createdAt,
        })
    } catch (error) {
        console.error('Get stats error:', error)
        return NextResponse.json(
            { error: 'Произошла ошибка при получении статистики' },
            { status: 500 }
        )
    }
}
