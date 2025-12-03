import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const subjectSchema = z.object({
    name: z.string().min(2, 'Название должно содержать минимум 2 символа'),
    color: z.string(),
    icon: z.string().optional(),
})

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const user = await getCurrentUser(request)
        const { id } = params

        if (!user) {
            return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
        }

        const subject = await prisma.subject.findFirst({
            where: {
                id: id,
                userId: user.id,
            },
            include: {
                students: true,
                lessons: {
                    include: { student: true },
                    orderBy: { date: 'desc' },
                },
                _count: {
                    select: { students: true, lessons: true },
                },
            },
        })

        if (!subject) {
            return NextResponse.json({ error: 'Предмет не найден' }, { status: 404 })
        }

        return NextResponse.json(subject)
    } catch (error) {
        console.error('Get subject error:', error)
        return NextResponse.json(
            { error: 'Произошла ошибка при получении данных предмета' },
            { status: 500 }
        )
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const user = await getCurrentUser(request)
        const { id } = params

        if (!user) {
            return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
        }

        const body = await request.json()
        const validatedData = subjectSchema.parse(body)

        const subject = await prisma.subject.updateMany({
            where: {
                id: id,
                userId: user.id,
            },
            data: validatedData,
        })

        if (subject.count === 0) {
            return NextResponse.json({ error: 'Предмет не найден' }, { status: 404 })
        }

        const updatedSubject = await prisma.subject.findUnique({
            where: { id: id },
        })

        return NextResponse.json(updatedSubject)
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: error.errors[0].message },
                { status: 400 }
            )
        }

        console.error('Update subject error:', error)
        return NextResponse.json(
            { error: 'Произошла ошибка при обновлении предмета' },
            { status: 500 }
        )
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const user = await getCurrentUser(request)
        const { id } = params

        if (!user) {
            return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
        }

        const body = await request.json()

        // Allow partial updates
        const updateData: any = {}
        if (body.name !== undefined) updateData.name = body.name
        if (body.color !== undefined) updateData.color = body.color
        if (body.icon !== undefined) updateData.icon = body.icon

        const subject = await prisma.subject.updateMany({
            where: {
                id: id,
                userId: user.id,
            },
            data: updateData,
        })

        if (subject.count === 0) {
            return NextResponse.json({ error: 'Предмет не найден' }, { status: 404 })
        }

        const updatedSubject = await prisma.subject.findUnique({
            where: { id: id },
        })

        return NextResponse.json(updatedSubject)
    } catch (error) {
        console.error('Patch subject error:', error)
        return NextResponse.json(
            { error: 'Произошла ошибка при обновлении предмета' },
            { status: 500 }
        )
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const user = await getCurrentUser(request)
        const { id } = params

        if (!user) {
            return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
        }

        // First, check if the subject exists and belongs to the user
        const subject = await prisma.subject.findFirst({
            where: {
                id: id,
                userId: user.id,
            },
            include: {
                _count: {
                    select: { lessons: true }
                }
            }
        })

        if (!subject) {
            return NextResponse.json({ error: 'Предмет не найден' }, { status: 404 })
        }

        const lessonsCount = subject._count.lessons

        // Delete all lessons associated with this subject
        if (lessonsCount > 0) {
            await prisma.lesson.deleteMany({
                where: {
                    subjectId: id,
                    ownerId: user.id,
                }
            })
        }

        // Delete the subject
        await prisma.subject.delete({
            where: {
                id: id,
            },
        })

        return NextResponse.json({
            success: true,
            deletedLessonsCount: lessonsCount
        })
    } catch (error) {
        console.error('Delete subject error:', error)
        return NextResponse.json(
            { error: 'Произошла ошибка при удалении предмета' },
            { status: 500 }
        )
    }
}
