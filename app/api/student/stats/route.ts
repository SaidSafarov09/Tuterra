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

        const userId = payload.userId

        // Get student records for this user
        const studentRecords = await prisma.student.findMany({
            where: { linkedUserId: userId },
            select: {
                id: true,
                ownerId: true,
                owner: {
                    select: {
                        id: true,
                        name: true,
                        firstName: true,
                        lastName: true
                    }
                }
            }
        })

        const ownerIds = studentRecords.map(s => s.ownerId)
        const studentIds = studentRecords.map(s => s.id)

        // Get upcoming lessons
        const upcomingLessons = await prisma.lesson.findMany({
            where: {
                OR: [
                    { studentId: { in: studentIds } },
                    { group: { students: { some: { id: { in: studentIds } } } } }
                ],
                date: { gte: new Date() },
                isCanceled: false
            },
            include: {
                student: true,
                group: true,
                subject: true,
                owner: {
                    select: {
                        id: true,
                        name: true,
                        firstName: true,
                        avatar: true
                    }
                }
            },
            orderBy: { date: 'asc' },
            take: 5
        })

        // Get unpaid lessons
        const rawUnpaidLessons = await prisma.lesson.findMany({
            where: {
                OR: [
                    { studentId: { in: studentIds } },
                    { group: { students: { some: { id: { in: studentIds } } } } }
                ],
                isPaid: false,
                isCanceled: false,
                price: { gt: 0 }
            },
            include: {
                student: true,
                group: true,
                subject: true,
                lessonPayments: {
                    where: {
                        studentId: { in: studentIds }
                    }
                },
                owner: {
                    select: {
                        id: true,
                        name: true,
                        firstName: true,
                        avatar: true
                    }
                }
            },
            orderBy: { date: 'desc' },
            take: 20
        })

        // Filter unpaid lessons correctly for the specific student
        const unpaidLessons = rawUnpaidLessons.filter(lesson => {
            // For individual lessons
            if (lesson.studentId) {
                return !lesson.isPaid
            }
            // For group lessons
            if (lesson.groupId) {
                const myPayment = lesson.lessonPayments?.[0]

                // If payment record exists, check status
                if (myPayment) {
                    return !myPayment.hasPaid
                }

                // If NO payment record exists:
                // 1. If lesson is in the future, consider it Unpaid (upcoming).
                // 2. If lesson is in the past (ghost lesson, wasn't there), hide it.
                const isPast = new Date(lesson.date) < new Date()
                if (isPast) return false

                return true
            }
            return false
        }).slice(0, 5)

        // Fetch ALL potential lessons for detailed counting/filtering
        const allPotentialLessons = await prisma.lesson.findMany({
            where: {
                OR: [
                    { studentId: { in: studentIds } },
                    { group: { students: { some: { id: { in: studentIds } } } } }
                ],
                isCanceled: false
            },
            select: {
                id: true,
                date: true,
                studentId: true,
                groupId: true,
                duration: true, // needed if we want strict time checks, but date check is usually enough
                lessonPayments: {
                    where: { studentId: { in: studentIds } },
                    select: { hasPaid: true }
                }
            }
        })

        const now = new Date()
        const startOfMonth = new Date()
        startOfMonth.setDate(1)
        startOfMonth.setHours(0, 0, 0, 0)

        // Filter lessons (exclude ghost group lessons)
        const validLessons = allPotentialLessons.filter(lesson => {
            // Direct lesson -> Keep
            if (lesson.studentId) return true

            // Group lesson -> Check ghost status
            if (lesson.groupId) {
                const hasPayment = lesson.lessonPayments && lesson.lessonPayments.length > 0
                if (hasPayment) return true

                // No payment: Show only if future
                const isPast = new Date(lesson.date) < now
                if (isPast) return false // Ghost (Past & No Record)

                return true // Future (Upcoming)
            }
            return true
        })

        // Calculate counts based on VALID lessons
        const totalLessonsCount = validLessons.length

        const monthLessonsCount = validLessons.filter(l => new Date(l.date) >= startOfMonth).length

        const teachersCount = new Set(ownerIds).size

        return NextResponse.json({
            success: true,
            stats: {
                teachersCount,
                totalLessonsCount,
                monthLessonsCount,
                upcomingLessons,
                unpaidLessons
            }
        })

    } catch (error) {
        console.error('Student stats error:', error)
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
    }
}
