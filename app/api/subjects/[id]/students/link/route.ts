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

        const { id: subjectId } = await params
        const { studentId } = await request.json()

        if (!studentId) {
            return NextResponse.json({ error: 'studentId обязателен' }, { status: 400 })
        }

        
        const subject = await prisma.subject.findFirst({
            where: {
                id: subjectId,
                userId: user.id,
            },
        })

        if (!subject) {
            return NextResponse.json({ error: 'Предмет не найден' }, { status: 404 })
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

        
        await prisma.student.update({
            where: { id: studentId },
            data: {
                subjects: {
                    connect: { id: subjectId },
                },
            },
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Link student to subject error:', error)
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

        const { id: subjectId } = await params
        const { studentId } = await request.json()

        if (!studentId) {
            return NextResponse.json({ error: 'studentId обязателен' }, { status: 400 })
        }

        
        const subject = await prisma.subject.findFirst({
            where: {
                id: subjectId,
                userId: user.id,
            },
        })

        if (!subject) {
            return NextResponse.json({ error: 'Предмет не найден' }, { status: 404 })
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

        
        await prisma.student.update({
            where: { id: studentId },
            data: {
                subjects: {
                    disconnect: { id: subjectId },
                },
            },
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Unlink student from subject error:', error)
        return NextResponse.json(
            { error: 'Произошла ошибка' },
            { status: 500 }
        )
    }
}
