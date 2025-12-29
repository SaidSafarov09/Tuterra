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
            // For group lessons, check if THIS student paid
            if (lesson.groupId) {
                const myPayment = lesson.lessonPayments?.[0]
                return myPayment ? !myPayment.hasPaid : true
            }
            return false
        }).slice(0, 5)

        // Get monthly lesson count
        const startOfMonth = new Date()
        startOfMonth.setDate(1)
        startOfMonth.setHours(0, 0, 0, 0)

        const monthLessonsCount = await prisma.lesson.count({
            where: {
                OR: [
                    { studentId: { in: studentIds } },
                    { group: { students: { some: { id: { in: studentIds } } } } }
                ],
                date: { gte: startOfMonth },
                isCanceled: false
            }
        })

        // Total lessons
        const totalLessonsCount = await prisma.lesson.count({
            where: {
                OR: [
                    { studentId: { in: studentIds } },
                    { group: { students: { some: { id: { in: studentIds } } } } }
                ],
                isCanceled: false
            }
        })

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
