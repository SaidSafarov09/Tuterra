import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const studentSchema = z.object({
    name: z.string().min(2, 'Имя должно содержать минимум 2 символа'),
    contact: z.string().optional(),
    note: z.string().optional(),
})

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
        }

        const student = await prisma.student.findFirst({
            where: {
                id: params?.id,
                ownerId: session.user?.id,
            },
            include: {
                lessons: {
                    orderBy: { date: 'desc' },
                },
                _count: {
                    select: { lessons: true },
                },
            },
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
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
        }

        const body = await request.json()
        const validatedData = studentSchema.parse(body)

        const student = await prisma.student.updateMany({
            where: {
                id: params?.id,
                ownerId: session.user?.id,
            },
            data: validatedData,
        })

        if (student.count === 0) {
            return NextResponse.json({ error: 'Ученик не найден' }, { status: 404 })
        }

        const updatedStudent = await prisma.student.findUnique({
            where: { id: params?.id },
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
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
        }

        const deleted = await prisma.student.deleteMany({
            where: {
                id: params?.id,
                ownerId: session.user?.id,
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
