import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

import { prisma } from '@/lib/prisma'

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCurrentUser(request)
        if (!user) {
            return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
        }

        const { id: groupId } = await params
        const { studentId } = await request.json()

        if (!studentId) {
            return NextResponse.json({ error: 'studentId обязателен' }, { status: 400 })
        }

        const group = await prisma.group.findUnique({
            where: { id: groupId },
        })

        if (!group) {
            return NextResponse.json({ error: `Группа не найдена (ID: ${groupId})` }, { status: 404 })
        }

        if (group.ownerId !== user.id) {
            return NextResponse.json({ error: `Нет прав на группу` }, { status: 403 })
        }

        const student = await prisma.student.findUnique({
            where: { id: studentId },
        })

        if (!student) {
            return NextResponse.json({ error: `Ученик не найден (ID: ${studentId})` }, { status: 404 })
        }

        if (student.ownerId !== user.id) {
            return NextResponse.json({ error: `Нет прав на ученика` }, { status: 403 })
        }

        await prisma.group.update({
            where: { id: groupId },
            data: {
                students: {
                    connect: { id: studentId },
                },
            },
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Link student to group error:', error)
        return NextResponse.json(
            { error: 'Произошла ошибка' },
            { status: 500 }
        )
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCurrentUser(request)
        if (!user) {
            return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
        }

        const { id: groupId } = await params
        const { studentId } = await request.json()

        if (!studentId) {
            return NextResponse.json({ error: 'studentId обязателен' }, { status: 400 })
        }

        const group = await prisma.group.findFirst({
            where: {
                id: groupId,
                ownerId: user.id,
            },
        })

        if (!group) {
            return NextResponse.json({ error: 'Группа не найдена' }, { status: 404 })
        }

        const student = await prisma.student.findFirst({
            where: {
                id: studentId,
                ownerId: user.id,
            },
        })

        if (!student) {
            return NextResponse.json({ error: 'Ученик не найден' }, { status: 404 })
        }

        await prisma.group.update({
            where: { id: groupId },
            data: {
                students: {
                    disconnect: { id: studentId },
                },
            },
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Unlink student from group error:', error)
        return NextResponse.json(
            { error: 'Произошла ошибка' },
            { status: 500 }
        )
    }
}
