import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/jwt'
import { isConnectionLocked } from '@/lib/guard'

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
            select: { id: true, ownerId: true }
        })

        // Filter out locked connections
        const activeStudents = await Promise.all(students.map(async (s) => {
            const isLocked = await isConnectionLocked(s.id, s.ownerId)
            return isLocked ? null : s
        }))

        const studentIds = activeStudents.filter(s => s !== null).map(s => s!.id)

        if (studentIds.length === 0) {
            return NextResponse.json([])
        }

        const where: any = {
            OR: [
                { studentId: { in: studentIds } },
                { group: { students: { some: { id: { in: studentIds } } } } }
            ]
        }

        const now = new Date()
        // For upcoming, we want to include ongoing lessons. 
        // So we fetch lessons starting from a bit earlier (e.g. 5 hours ago) to catch any long duration lessons that are still ongoing.
        const recentPast = new Date(now.getTime() - 5 * 60 * 60 * 1000)

        if (filter === 'upcoming') {
            // Fetch from slightly in the past to catch ongoing
            where.date = { gte: recentPast }
            where.isCanceled = false
        } else if (filter === 'past') {
            where.date = { lt: now }
            where.isCanceled = false
        } else if (filter === 'unpaid') {
            where.isPaid = false
            where.isCanceled = false
            where.price = { gt: 0 }
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

        // Filter and categorize based on exact duration
        const filteredLessons = lessons.filter(lesson => {
            const lessonEnd = new Date(new Date(lesson.date).getTime() + (lesson.duration || 60) * 60 * 1000)
            const isLessonFinished = lessonEnd <= now

            // Apply time-based filtering strictly
            if (filter === 'upcoming') {
                if (isLessonFinished) return false
            } else if (filter === 'past') {
                if (!isLessonFinished) return false
            }

            // Direct lesson
            if (lesson.studentId) return true

            // Group lesson filtering (ghost check)
            if (lesson.groupId) {
                // Check if any of the student's IDs have a payment record for this lesson
                const hasPayment = lesson.lessonPayments.some(p => studentIds.includes(p.studentId))

                if (hasPayment) return true

                // If no payment, only show if it's in the future (or ongoing)
                if (!isLessonFinished) return true

                return false // Past and no visible record -> Hide
            }

            return true
        })

        // Map lessons to include student-specific status
        const lessonsWithStatus = filteredLessons.map(lesson => {
            let userHasPaid = false;
            if (lesson.studentId) {
                userHasPaid = lesson.isPaid;
            } else if (lesson.groupId) {
                userHasPaid = lesson.lessonPayments.some(p => studentIds.includes(p.studentId) && p.hasPaid);
            }
            return {
                ...lesson,
                userHasPaid
            };
        });

        return NextResponse.json(lessonsWithStatus)
    } catch (error) {
        console.error('Get student lessons error:', error)
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
    }
}
