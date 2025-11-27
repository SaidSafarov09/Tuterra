import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const lessonSchema = z.object({
    studentId: z.string(),
    subjectId: z.string().optional(),
    date: z.string().transform((str) => new Date(str)),
    price: z.number().positive('Цена должна быть положительной'),
    isPaid: z.boolean().optional(),
    isCanceled: z.boolean().optional(),
})

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const filter = searchParams.get('filter')

        const now = new Date()
        let where: any = { ownerId: session.user?.id }

        if (filter === 'upcoming') {
            where.date = { gte: now }
            where.isCanceled = false
        } else if (filter === 'past') {
            where.date = { lt: now }
            where.isCanceled = false
        } else if (filter === 'unpaid') {
            where.isPaid = false
            where.isCanceled = false
        } else if (filter === 'canceled') {
            where.isCanceled = true
        }

        const lessons = await prisma.lesson.findMany({
            where: where as any,
            include: {
                student: true,
                subject: true,
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
        const student = await prisma.student.findFirst({
            where: {
                id: validatedData.studentId,
                ownerId: session.user?.id,
            },
            include: {
                subjects: true
            } as any
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
                subject: true,
            },
        })
        if (validatedData.subjectId) {
            try {
                await prisma.student.update({
                    where: { id: validatedData.studentId },
                    data: {
                        subjects: {
                            connect: { id: validatedData.subjectId },
                        },
                    } as any,
                })
            } catch (error) {
                console.log('Subject linking attempt result:', error)
            }
        }

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
