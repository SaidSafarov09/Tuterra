import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
        }

        const { id: subjectId } = await params
        const { studentId } = await request.json()

        if (!studentId) {
            return NextResponse.json({ error: 'studentId обязателен' }, { status: 400 })
        }

        // Verify subject belongs to user
        const subject = await prisma.subject.findFirst({
            where: {
                id: subjectId,
                userId: session.user.id,
            },
        })

        if (!subject) {
            return NextResponse.json({ error: 'Предмет не найден' }, { status: 404 })
        }

        // Verify student belongs to user
        const student = await prisma.student.findFirst({
            where: {
                id: studentId,
                ownerId: session.user.id,
            },
        })

        if (!student) {
            return NextResponse.json({ error: 'Ученик не найден' }, { status: 404 })
        }

        // Link student to subject
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
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
        }

        const { id: subjectId } = await params
        const { studentId } = await request.json()

        if (!studentId) {
            return NextResponse.json({ error: 'studentId обязателен' }, { status: 400 })
        }

        // Verify subject belongs to user
        const subject = await prisma.subject.findFirst({
            where: {
                id: subjectId,
                userId: session.user.id,
            },
        })

        if (!subject) {
            return NextResponse.json({ error: 'Предмет не найден' }, { status: 404 })
        }

        // Verify student belongs to user
        const student = await prisma.student.findFirst({
            where: {
                id: studentId,
                ownerId: session.user.id,
            },
        })

        if (!student) {
            return NextResponse.json({ error: 'Ученик не найден' }, { status: 404 })
        }

        // Unlink student from subject
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
