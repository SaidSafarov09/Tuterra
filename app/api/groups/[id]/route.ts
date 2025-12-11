import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/jwt'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const groupSchema = z.object({
    name: z.string().min(2, 'Название должно содержать минимум 2 символа').optional(),
    subjectId: z.string().min(1, 'Выберите предмет').optional(),
    studentIds: z.array(z.string()).optional(),
    note: z.string().optional(),
})

export async function GET(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params
    try {
        const token = request.cookies.get('auth-token')?.value
        if (!token) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })

        const payload = await verifyToken(token)
        if (!payload) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })

        const group = await prisma.group.findUnique({
            where: { id: params.id, ownerId: payload.userId },
            include: {
                subject: true,
                students: true,
                lessons: {
                    orderBy: { date: 'desc' },
                    include: {
                        lessonPayments: true
                    }
                },
                _count: {
                    select: { lessons: true, students: true },
                },
            },
        })

        if (!group) {
            return NextResponse.json({ error: 'Группа не найдена' }, { status: 404 })
        }

        return NextResponse.json(group)
    } catch (error) {
        console.error('Get group error:', error)
        return NextResponse.json(
            { error: 'Произошла ошибка при получении группы' },
            { status: 500 }
        )
    }
}

export async function PATCH(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params
    try {
        const token = request.cookies.get('auth-token')?.value
        if (!token) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })

        const payload = await verifyToken(token)
        if (!payload) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })

        const body = await request.json()
        const validatedData = groupSchema.parse(body)

        const group = await prisma.group.update({
            where: { id: params.id, ownerId: payload.userId },
            data: {
                name: validatedData.name,
                subjectId: validatedData.subjectId,
                note: validatedData.note,
                students: validatedData.studentIds ? {
                    set: validatedData.studentIds.map(id => ({ id }))
                } : undefined,
            },
            include: {
                subject: true,
                students: true,
            }
        })

        return NextResponse.json(group)
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: error.errors[0].message },
                { status: 400 }
            )
        }

        console.error('Update group error:', error)
        return NextResponse.json(
            { error: 'Произошла ошибка при обновлении группы' },
            { status: 500 }
        )
    }
}

export async function DELETE(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params
    try {
        const token = request.cookies.get('auth-token')?.value
        if (!token) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })

        const payload = await verifyToken(token)
        if (!payload) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })

        await prisma.group.delete({
            where: { id: params.id, ownerId: payload.userId },
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Delete group error:', error)
        return NextResponse.json(
            { error: 'Произошла ошибка при удалении группы' },
            { status: 500 }
        )
    }
}
