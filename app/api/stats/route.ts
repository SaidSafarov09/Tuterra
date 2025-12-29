import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/jwt'
import { prisma } from '@/lib/prisma'
import { startOfMonth, endOfMonth } from 'date-fns'

export async function GET(request: NextRequest) {
    try {
        const token = request.cookies.get('auth-token')?.value
        if (!token) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })

        const payload = await verifyToken(token)
        if (!payload) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })

        const userId = payload.userId
        const isStudent = payload.role === 'student'
        const now = new Date()
        const monthStart = startOfMonth(now)
        const monthEnd = endOfMonth(now)

        if (isStudent) {
            // Student specific stats
            const studentRecords = await prisma.student.findMany({
                where: { linkedUserId: userId },
                select: { id: true, ownerId: true }
            })
            const studentIds = studentRecords.map(s => s.id)
            const teacherIds = Array.from(new Set(studentRecords.map(s => s.ownerId)))

            const [upcomingLessons, rawUnpaidLessons, totalLessons, monthLessonsCount] = await Promise.all([
                prisma.lesson.findMany({
                    where: {
                        OR: [
                            { studentId: { in: studentIds } },
                            { group: { students: { some: { id: { in: studentIds } } } } }
                        ],
                        date: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
                        isCanceled: false,
                    },
                    include: {
                        student: true,
                        subject: true,
                        group: true,
                        owner: {
                            select: { id: true, name: true, firstName: true, avatar: true }
                        }
                    },
                    orderBy: { date: 'asc' },
                    take: 10,
                }),
                prisma.lesson.findMany({
                    where: {
                        OR: [
                            { studentId: { in: studentIds } },
                            { group: { students: { some: { id: { in: studentIds } } } } }
                        ],
                        isCanceled: false,
                        price: { gt: 0 },
                        isPaid: false,
                    },
                    include: {
                        student: true,
                        subject: true,
                        group: {
                            include: { students: true }
                        },
                        lessonPayments: {
                            where: {
                                studentId: { in: studentIds }
                            }
                        },
                        owner: {
                            select: { id: true, name: true, firstName: true, avatar: true }
                        }
                    },
                    orderBy: { date: 'desc' },
                    take: 20,
                }),
                prisma.lesson.count({
                    where: {
                        OR: [
                            { studentId: { in: studentIds } },
                            { group: { students: { some: { id: { in: studentIds } } } } }
                        ],
                        date: { lte: now },
                        isCanceled: false,
                    }
                }),
                prisma.lesson.count({
                    where: {
                        OR: [
                            { studentId: { in: studentIds } },
                            { group: { students: { some: { id: { in: studentIds } } } } }
                        ],
                        date: { gte: monthStart, lte: monthEnd },
                        isCanceled: false,
                    }
                })
            ])

            const { isLessonPast } = await import('@/lib/lessonTimeUtils')
            const filteredUpcomingLessons = upcomingLessons
                .filter(lesson => !isLessonPast(lesson.date, lesson.duration || 60))
                .slice(0, 5)

            // Filter unpaid lessons correctly for student
            const unpaidForStudent = rawUnpaidLessons.filter(lesson => {
                // If it's a direct lesson
                if (lesson.studentId) {
                    return !lesson.isPaid
                }
                // If it's a group lesson, check if this specific student paid
                if (lesson.groupId) {
                    const myPayment = lesson.lessonPayments?.[0]
                    return myPayment ? !myPayment.hasPaid : true
                }
                return false
            })

            return NextResponse.json({
                success: true, // For compatibility
                stats: { // For compatibility with my DashboardPage edit
                    teachersCount: teacherIds.length,
                    totalLessonsCount: totalLessons,
                    monthLessonsCount,
                    upcomingLessons: filteredUpcomingLessons,
                    unpaidLessons: unpaidForStudent,
                    studentsCount: 0,
                    groupsCount: 0,
                    subjectsCount: 0
                },
                // Raw top-level for backwards compatibility if needed
                teachersCount: teacherIds.length,
                upcomingLessons: filteredUpcomingLessons,
                unpaidLessons: unpaidForStudent,
                monthLessonsCount,
                totalLessonsCount: totalLessons,
                isStudent: true
            })
        }

        // Teacher logic (existing)
        const results = await Promise.all([
            prisma.student.count({
                where: { ownerId: userId },
            }),
            prisma.lesson.findMany({
                where: {
                    ownerId: userId,
                    date: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
                    isCanceled: false,
                } as any,
                include: {
                    student: true,
                    subject: true,
                    group: {
                        include: { students: true }
                    },
                    lessonPayments: true,
                },
                orderBy: { date: 'asc' },
                take: 10,
            }),
            prisma.lesson.findMany({
                where: {
                    ownerId: userId,
                    isPaid: false,
                    isCanceled: false,
                    price: { gt: 0 },
                } as any,
                include: {
                    student: true,
                    subject: true,
                    group: {
                        include: { students: true }
                    },
                    lessonPayments: true,
                },
                orderBy: { date: 'desc' },
                take: 20,
            }),
            prisma.lesson.findMany({
                where: {
                    ownerId: userId,
                    date: { gte: monthStart, lte: monthEnd },
                    OR: [
                        { isPaid: true },
                        { lessonPayments: { some: { hasPaid: true } } }
                    ]
                } as any,
                include: {
                    lessonPayments: true,
                    group: { include: { students: true } }
                }
            }),
            prisma.lesson.count({
                where: {
                    ownerId: userId,
                    date: { lte: now },
                    isCanceled: false,
                } as any,
            }),
            prisma.subject.count({
                where: { userId: userId },
            }),
            prisma.user.findUnique({
                where: { id: userId },
                select: { createdAt: true },
            }),
            prisma.group.count({
                where: { ownerId: userId },
            }),
            prisma.lesson.count({
                where: {
                    ownerId: userId,
                    date: { gte: monthStart, lte: monthEnd },
                    isCanceled: false,
                } as any,
            }),
            (prisma as any).lessonRequest.findMany({
                where: {
                    lesson: { ownerId: userId },
                    status: 'pending'
                },
                include: {
                    lesson: {
                        include: { student: true, subject: true, group: true }
                    },
                    user: {
                        select: { name: true, firstName: true, email: true }
                    }
                },
                orderBy: { createdAt: 'desc' }
            })
        ])

        const [
            countStudents,
            tUpcomingLessons,
            tRawUnpaidLessons,
            mIncomeData,
            totalTLessons,
            countSubjects,
            uProfile,
            countGroups,
            mLessonsCount,
            pRequests
        ] = results as any[]

        const unpaidLessons = tRawUnpaidLessons.filter((lesson: any) => {
            if (!lesson.group) return true

            // Fix for "New Student in Group causing old lessons to appear as unpaid"
            // If the lesson has payment records (meaning attendance was likely processed),
            // we should only compare against the number of generated payment records (attendees),
            // rather than the current total number of students in the group (which might include new members).
            const hasPayments = lesson.lessonPayments && lesson.lessonPayments.length > 0

            const totalStudents = hasPayments
                ? lesson.lessonPayments.length
                : (lesson.group.students?.length || 0)

            if (totalStudents === 0) return false // Empty group or no attendees -> Not "Unpaid"

            const paidCount = lesson.lessonPayments?.filter((p: any) => p.hasPaid).length || 0

            return paidCount < totalStudents
        })

        const { isLessonPast } = await import('@/lib/lessonTimeUtils')
        const filteredUpcomingLessons = tUpcomingLessons
            .filter((lesson: any) => !isLessonPast(lesson.date, lesson.duration || 60))
            .slice(0, 5)

        return NextResponse.json({
            success: true,
            stats: {
                studentsCount: countStudents,
                groupsCount: countGroups,
                upcomingLessons: filteredUpcomingLessons,
                unpaidLessons,
                monthlyIncome: (mIncomeData as any[]).reduce((total, lesson) => {
                    if (lesson.group && lesson.lessonPayments?.length > 0) {
                        return total + (lesson.lessonPayments.filter((p: any) => p.hasPaid).length * lesson.price)
                    }
                    return total + lesson.price
                }, 0),
                totalLessons: totalTLessons,
                subjectsCount: countSubjects,
                monthLessonsCount: mLessonsCount,
                pendingRequests: pRequests,
                createdAt: uProfile?.createdAt,
            },
            // Flat props for backwards compatibility
            studentsCount: countStudents,
            groupsCount: countGroups,
            upcomingLessons: filteredUpcomingLessons,
            unpaidLessons,
            pendingRequests: pRequests,
            monthlyIncome: (mIncomeData as any[]).reduce((total, lesson) => {
                if (lesson.group && lesson.lessonPayments?.length > 0) {
                    return total + (lesson.lessonPayments.filter((p: any) => p.hasPaid).length * lesson.price)
                }
                return total + lesson.price
            }, 0),
            totalLessons: totalTLessons,
            subjectsCount: countSubjects,
            monthLessonsCount: mLessonsCount,
            createdAt: uProfile?.createdAt,
        })
    } catch (error) {
        console.error('Get stats error:', error)
        return NextResponse.json(
            { error: 'Произошла ошибка при получении статистики' },
            { status: 500 }
        )
    }
}
