import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/jwt'
import { z } from 'zod'

const requestSchema = z.object({
    type: z.enum(['cancel', 'reschedule']),
    newDate: z.string().optional(),
    reason: z.string().optional(),
})

export async function POST(
    request: NextRequest,
    context: { params: Promise<{ id: string }> } // Use Promise for params
) {
    try {
        const { id: lessonId } = await context.params
        const token = request.cookies.get('auth-token')?.value
        if (!token) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

        const payload = await verifyToken(token)
        if (!payload || payload.role !== 'student') {
            return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
        }

        const body = await request.json()
        const { type, newDate, reason } = requestSchema.parse(body)

        // Verify student belongs to this lesson
        const lesson = await prisma.lesson.findUnique({
            where: { id: lessonId },
            include: {
                student: true,
                group: {
                    include: {
                        students: true
                    }
                }
            }
        })

        if (!lesson) {
            return NextResponse.json({ success: false, error: 'Lesson not found' }, { status: 404 })
        }

        const isDirectStudent = lesson.studentId && (await prisma.student.findFirst({
            where: { id: lesson.studentId, linkedUserId: payload.userId }
        }))

        const isGroupStudent = lesson.groupId && (await prisma.student.findFirst({
            where: {
                linkedUserId: payload.userId,
                groups: { some: { id: lesson.groupId } }
            }
        }))

        if (!isDirectStudent && !isGroupStudent) {
            return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 })
        }

        // Create the request
        const lessonRequest = await (prisma as any).lessonRequest.create({
            data: {
                lessonId,
                userId: payload.userId,
                type,
                newDate: newDate ? new Date(newDate) : null,
                reason,
                status: 'pending'
            }
        })

        // Update lesson status
        await prisma.lesson.update({
            where: { id: lessonId },
            data: {
                status: type === 'cancel' ? 'pending_cancel' : 'pending_reschedule'
            } as any
        })

        return NextResponse.json({
            success: true,
            request: lessonRequest
        })

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ success: false, error: error.errors[0].message }, { status: 400 })
        }
        console.error('Create lesson request error:', error)
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
    }
}
