import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const lessonSchema = z.object({
    studentId: z.string(),
    date: z.string().transform((str) => new Date(str)),
    price: z.number().nonnegative('Цена должна быть положительной'),
    isPaid: z.boolean(),
    isCanceled: z.boolean().optional(),
    notes: z.string().optional(),
    topic: z.string().optional(),
})

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {

    try {
        const { id } = await params
        const user = await getCurrentUser(request)

        if (!user) {
            return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
        }

        const lesson = await prisma.lesson.findFirst({
            where: {
                id: id,
                ownerId: user.id,
            },
            include: {
                student: true,
                subject: true,
            },
        })

        if (!lesson) {
            return NextResponse.json({ error: 'Занятие не найдено' }, { status: 404 })
        }

        return NextResponse.json(lesson)
    } catch (error) {
        console.error('Get lesson error:', error)
        return NextResponse.json(
            { error: 'Произошла ошибка при получении данных занятия' },
            { status: 500 }
        )
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const user = await getCurrentUser(request)

        if (!user) {
            return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
        }

        const body = await request.json()
        const validatedData = lessonSchema.parse(body)
        const student = await prisma.student.findFirst({
            where: {
                id: validatedData.studentId,
                ownerId: user.id,
            },
        })

        if (!student) {
            return NextResponse.json(
                { error: 'Ученик не найден' },
                { status: 404 }
            )
        }

        const lesson = await prisma.lesson.updateMany({
            where: {
                id: id,
                ownerId: user.id,
            },
            data: validatedData as any,
        })

        if (lesson.count === 0) {
            return NextResponse.json({ error: 'Занятие не найдено' }, { status: 404 })
        }

        const updatedLesson = await prisma.lesson.findUnique({
            where: { id: id },
            include: { student: true },
        })

        return NextResponse.json(updatedLesson)
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: error.errors[0].message },
                { status: 400 }
            )
        }

        console.error('Update lesson error:', error)
        return NextResponse.json(
            { error: 'Произошла ошибка при обновлении занятия' },
            { status: 500 }
        )
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const user = await getCurrentUser(request)

        if (!user) {
            return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
        }

        const body = await request.json()
        const updateData: any = {}
        if (body.isPaid !== undefined) updateData.isPaid = body.isPaid
        if (body.price !== undefined) updateData.price = body.price
        if (body.date !== undefined) updateData.date = new Date(body.date)
        if (body.studentId !== undefined) updateData.studentId = body.studentId
        if (body.subjectId !== undefined) updateData.subjectId = body.subjectId
        if (body.isCanceled !== undefined) updateData.isCanceled = body.isCanceled
        if (body.notes !== undefined) updateData.notes = body.notes
        if (body.topic !== undefined) updateData.topic = body.topic

        const lesson = await prisma.lesson.updateMany({
            where: {
                id: id,
                ownerId: user.id,
            },
            data: updateData as any,
        })

        if (lesson.count === 0) {
            return NextResponse.json({ error: 'Занятие не найдено' }, { status: 404 })
        }

        const updatedLesson = await prisma.lesson.findUnique({
            where: { id: id },
            include: { student: true, subject: true },
        })

        return NextResponse.json(updatedLesson)
    } catch (error) {
        console.error('Patch lesson error:', error)
        return NextResponse.json(
            { error: 'Произошла ошибка при обновлении занятия' },
            { status: 500 }
        )
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const user = await getCurrentUser(request)

        if (!user) {
            return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
        }

        const deleted = await prisma.lesson.deleteMany({
            where: {
                id: id,
                ownerId: user.id,
            },
        })

        if (deleted.count === 0) {
            return NextResponse.json({ error: 'Занятие не найдено' }, { status: 404 })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Delete lesson error:', error)
        return NextResponse.json(
            { error: 'Произошла ошибка при удалении занятия' },
            { status: 500 }
        )
    }
}
