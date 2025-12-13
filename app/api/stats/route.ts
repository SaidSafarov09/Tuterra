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


        const [studentsCount, upcomingLessons, rawUnpaidLessons, monthlyIncome, totalLessons, subjectsCount, userProfile] = await Promise.all([

            prisma.student.count({
                where: { ownerId: payload.userId },
            }),


            prisma.lesson.findMany({
                where: {
                    ownerId: payload.userId,
                    // Сдвигаем начало выборки на сутки назад, чтобы включить ongoing-занятия
                    date: { gte: new Date(now.getTime() - 24*60*60*1000) },
                    isCanceled: false,
                } as any,
                include: {
                    student: true,
                    subject: true,
                    group: {
                        include: {
                            students: true
                        }
                    },
                    lessonPayments: true,
                },
                orderBy: { date: 'asc' },
                take: 10, // Берем больше, чтобы после фильтрации осталось достаточно
            }),


            prisma.lesson.findMany({
                where: {
                    ownerId: payload.userId,
                    isPaid: false,
                    isCanceled: false,
                    price: { gt: 0 },
                } as any,
                include: {
                    student: true,
                    subject: true,
                    group: {
                        include: {
                            students: true
                        }
                    },
                    lessonPayments: true,
                },
                orderBy: { date: 'desc' },
            }),


            prisma.lesson.findMany({
                where: {
                    ownerId: payload.userId,
                    date: {
                        gte: monthStart,
                        lte: monthEnd,
                    },
                    OR: [
                        { isPaid: true },
                        { lessonPayments: { some: { hasPaid: true } } }
                    ]
                } as any,
                include: {
                    lessonPayments: true,
                    group: {
                        include: { students: true }
                    }
                }
            }),


            prisma.lesson.count({
                where: {
                    ownerId: payload.userId,
                    date: { lte: now },
                    isCanceled: false,
                } as any,
            }),


            prisma.subject.count({
                where: { userId: payload.userId },
            }),


            prisma.user.findUnique({
                where: { id: payload.userId },
                select: { createdAt: true },
            }),
        ])

        const unpaidLessons = rawUnpaidLessons.filter(lesson => {
            if (!lesson.group) return true
            const totalStudents = lesson.group.students?.length || 0
            if (totalStudents === 0) return true
            const paidCount = lesson.lessonPayments?.filter(p => p.hasPaid).length || 0
            return paidCount < totalStudents
        })

        // Фильтруем ближайшие занятия с учетом длительности
        const { isLessonPast } = await import('@/lib/lessonTimeUtils')
        const filteredUpcomingLessons = upcomingLessons
            .filter(lesson => !isLessonPast(lesson.date, lesson.duration || 60))
            .slice(0, 5) // Берем первые 5 после фильтрации

        return NextResponse.json({
            studentsCount,
            upcomingLessons: filteredUpcomingLessons,
            unpaidLessons,
            monthlyIncome: (monthlyIncome as any[]).reduce((total, lesson) => {
                if (lesson.group && lesson.lessonPayments?.length > 0) {
                    return total + (lesson.lessonPayments.filter((p: any) => p.hasPaid).length * lesson.price)
                }
                return total + lesson.price
            }, 0),
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
