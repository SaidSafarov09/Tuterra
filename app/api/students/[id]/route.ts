import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const studentSchema = z.object({
    name: z.string().min(2, 'Имя должно содержать минимум 2 символа'),
    contact: z.string().optional(),
    note: z.string().optional(),
}).passthrough()

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCurrentUser(request)
        const { id } = await params

        if (!user) {
            return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
        }

        const student = await prisma.student.findFirst({
            where: {
                id: id,
                ownerId: user.id,
            },
            include: {
                subjects: true,
                lessons: {
                    orderBy: { date: 'desc' },
                    include: { subject: true },
                },
                _count: {
                    select: { lessons: true },
                },
            } as any,
        })

        if (!student) {
            return NextResponse.json({ error: 'Ученик не найден' }, { status: 404 })
        }

        return NextResponse.json(student)
    } catch (error) {
        console.error('Get student error:', error)
        return NextResponse.json(
            { error: 'Произошла ошибка при получении данных ученика' },
            { status: 500 }
        )
    }
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCurrentUser(request)
        const { id } = await params

        if (!user) {
            return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
        }

        const body = await request.json()
        const validatedData = studentSchema.parse(body)

        const student = await prisma.student.updateMany({
            where: {
                id: id,
                ownerId: user.id,
            },
            data: validatedData,
        })

        if (student.count === 0) {
            return NextResponse.json({ error: 'Ученик не найден' }, { status: 404 })
        }

        const updatedStudent = await prisma.student.findUnique({
            where: { id: id },
        })

        return NextResponse.json(updatedStudent)
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: error.errors[0].message },
                { status: 400 }
            )
        }

        console.error('Update student error:', error)
        return NextResponse.json(
            { error: 'Произошла ошибка при обновлении ученика' },
            { status: 500 }
        )
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCurrentUser(request)
        const { id } = await params

        if (!user) {
            return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
        }

        const deleted = await prisma.student.deleteMany({
            where: {
                id: id,
                ownerId: user.id,
            },
        })

        if (deleted.count === 0) {
            return NextResponse.json({ error: 'Ученик не найден' }, { status: 404 })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Delete student error:', error)
        return NextResponse.json(
            { error: 'Произошла ошибка при удалении ученика' },
            { status: 500 }
        )
    }
}
