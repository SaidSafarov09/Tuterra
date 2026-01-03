import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/jwt'
import { sendTelegramNotification } from '@/lib/telegram'

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const token = request.cookies.get('auth-token')?.value
        if (!token) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })

        const payload = await verifyToken(token)
        if (!payload || payload.role !== 'teacher') {
            return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
        }

        const body = await request.json()
        const { status } = body // 'approved' | 'rejected'

        if (!['approved', 'rejected'].includes(status)) {
            return NextResponse.json({ error: 'Неверный статус' }, { status: 400 })
        }

        const lr = await (prisma as any).lessonRequest.findUnique({
            where: { id },
            include: { lesson: { include: { subject: true, student: true, group: true } } }
        })

        if (!lr) {
            return NextResponse.json({ error: 'Заявка не найдена' }, { status: 404 })
        }

        if (status === 'approved') {
            if (lr.type === 'reschedule' && lr.newDate) {
                const { checkLessonOverlap, formatConflictMessage } = await import('@/lib/lessonValidation')

                // Get teacher's timezone for conflict message
                const teacher = await prisma.user.findUnique({
                    where: { id: lr.lesson.ownerId },
                    select: { timezone: true }
                })
                const timezone = teacher?.timezone || 'Europe/Moscow'

                const conflict = await checkLessonOverlap(
                    lr.lesson.ownerId,
                    new Date(lr.newDate),
                    lr.lesson.duration,
                    lr.lessonId // Exclude current lesson from check
                )

                if (conflict) {
                    return NextResponse.json({
                        error: formatConflictMessage(conflict, undefined, timezone)
                    }, { status: 400 })
                }

                await prisma.lesson.update({
                    where: { id: lr.lessonId },
                    data: { date: lr.newDate }
                })
            } else if (lr.type === 'cancel') {
                await prisma.lesson.update({
                    where: { id: lr.lessonId },
                    data: { isCanceled: true }
                })
            }
        }

        const updatedRequest = await (prisma as any).lessonRequest.update({
            where: { id },
            data: { status }
        })

        return NextResponse.json({ success: true, request: updatedRequest })
    } catch (error) {
        console.error('Update request error:', error)
        return NextResponse.json({ error: 'Внутренняя ошибка' }, { status: 500 })
    }
}
