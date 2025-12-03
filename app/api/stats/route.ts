import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

import { prisma } from '@/lib/prisma'
import { startOfMonth, endOfMonth } from 'date-fns'

export async function GET(request: NextRequest) {
    try {
        const user = await getCurrentUser(request)

        if (!user) {
            return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
        }

        const now = new Date()
        const monthStart = startOfMonth(now)
        const monthEnd = endOfMonth(now)

        // Получаем статистику параллельно
        const [studentsCount, upcomingLessons, unpaidLessons, monthlyIncome, totalLessons, subjectsCount, userProfile] = await Promise.all([
            // Количество учеников
            prisma.student.count({
                where: { ownerId: user.id },
            }),

            // Ближайшие занятия
            prisma.lesson.findMany({
                where: {
                    ownerId: user.id,
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
                    ownerId: user.id,
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
                    ownerId: user.id,
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
                    ownerId: user.id,
                    date: { lte: now },
                    isCanceled: false,
                } as any,
            }),

            // Количество предметов
            prisma.subject.count({
                where: { userId: user.id },
            }),

            // Дата регистрации пользователя
            prisma.user.findUnique({
                where: { id: user.id },
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
