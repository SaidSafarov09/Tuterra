import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const subjectSchema = z.object({
    name: z.string().min(2, 'Название должно содержать минимум 2 символа'),
    color: z.string(),
    icon: z.string().optional(),
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

        const subject = await prisma.subject.findFirst({
            where: {
                id: params.id,
                userId: session.user.id,
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
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
        }

        const body = await request.json()
        const validatedData = subjectSchema.parse(body)

        const subject = await prisma.subject.updateMany({
            where: {
                id: params.id,
                userId: session.user.id,
            },
            data: validatedData,
        })

        if (subject.count === 0) {
            return NextResponse.json({ error: 'Предмет не найден' }, { status: 404 })
        }

        const updatedSubject = await prisma.subject.findUnique({
            where: { id: params.id },
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

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
        }

        const deleted = await prisma.subject.deleteMany({
            where: {
                id: params.id,
                userId: session.user.id,
            },
        })

        if (deleted.count === 0) {
            return NextResponse.json({ error: 'Предмет не найден' }, { status: 404 })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Delete subject error:', error)
        return NextResponse.json(
            { error: 'Произошла ошибка при удалении предмета' },
            { status: 500 }
        )
    }
}
