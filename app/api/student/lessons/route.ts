import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/jwt'

export async function GET(request: NextRequest) {
    try {
        const token = request.cookies.get('auth-token')?.value
        if (!token) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

        const payload = await verifyToken(token)
        if (!payload || payload.role !== 'student') {
            return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
        }

        const filter = request.nextUrl.searchParams.get('filter') || 'all'
        const userId = payload.userId

        // Get student records for this user
        const students = await prisma.student.findMany({
            where: { linkedUserId: userId },
            select: { id: true }
        })
        const studentIds = students.map(s => s.id)

        const where: any = {
            OR: [
                { studentId: { in: studentIds } },
                { group: { students: { some: { id: { in: studentIds } } } } }
            ]
        }

        const now = new Date()

        if (filter === 'upcoming') {
            where.date = { gte: now }
            where.isCanceled = false
        } else if (filter === 'past') {
            where.date = { lt: now }
            where.isCanceled = false
        } else if (filter === 'unpaid') {
            where.isPaid = false
            where.isCanceled = false
        } else if (filter === 'canceled') {
            where.isCanceled = true
        }

        const lessons = await prisma.lesson.findMany({
            where,
            include: {
                student: true,
                group: {
                    include: {
                        students: true
                    }
                },
                subject: true,
                lessonPayments: true,
                owner: true,
            },
            orderBy: {
                date: filter === 'upcoming' ? 'asc' : 'desc'
            }
        })

        // Filter out "ghost" group lessons (past lessons where student has no payment record)
        const filteredLessons = lessons.filter(lesson => {
            // Direct lesson
            if (lesson.studentId) return true

            // Group lesson
            if (lesson.groupId) {
                // Check if any of the student's IDs have a payment record for this lesson
                const hasPayment = lesson.lessonPayments.some(p => studentIds.includes(p.studentId))

                if (hasPayment) return true

                // If no payment, only show if it's in the future
                const isPast = new Date(lesson.date) < new Date()
                if (!isPast) return true

                return false // Past and no visible record -> Hide
            }

            return true
        })

        return NextResponse.json(filteredLessons)
    } catch (error) {
        console.error('Get student lessons error:', error)
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
    }
}
