import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const lessonSchema = z.object({
    studentId: z.string(),
    date: z.string().transform((str) => new Date(str)),
    price: z.number().positive('Цена должна быть положительной'),
    isPaid: z.boolean().optional(),
})

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const filter = searchParams.get('filter') // 'upcoming', 'past', 'unpaid'

        const now = new Date()
        let where: any = { ownerId: session.user?.id }

        if (filter === 'upcoming') {
            where.date = { gte: now }
        } else if (filter === 'past') {
            where.date = { lt: now }
        } else if (filter === 'unpaid') {
            where.isPaid = false
        }

        const lessons = await prisma.lesson.findMany({
            where,
            include: {
                student: true,
            },
            orderBy: { date: filter === 'past' ? 'desc' : 'asc' },
        })

        return NextResponse.json(lessons)
    } catch (error) {
        console.error('Get lessons error:', error)
        return NextResponse.json(
            { error: 'Произошла ошибка при получении списка занятий' },
            { status: 500 }
        )
    }
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
        }

        const body = await request.json()
        const validatedData = lessonSchema.parse(body)

        // Проверяем, что студент принадлежит текущему пользователю
        const student = await prisma.student.findFirst({
            where: {
                id: validatedData.studentId,
                ownerId: session.user?.id,
            },
        })

        if (!student) {
            return NextResponse.json(
                { error: 'Ученик не найден' },
                { status: 404 }
            )
        }

        const lesson = await prisma.lesson.create({
            data: {
                ...validatedData,
                ownerId: session.user?.id,
            },
            include: {
                student: true,
            },
        })

        return NextResponse.json(lesson, { status: 201 })
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: error.errors[0].message },
                { status: 400 }
            )
        }

        console.error('Create lesson error:', error)
        return NextResponse.json(
            { error: 'Произошла ошибка при создании занятия' },
            { status: 500 }
        )
    }
}
