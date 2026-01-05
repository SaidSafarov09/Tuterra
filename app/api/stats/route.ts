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

            const userProfile = await prisma.user.findUnique({
                where: { id: userId },
                select: { createdAt: true }
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
                    subjectsCount: 0,
                    createdAt: userProfile?.createdAt
                },
                // Raw top-level for backwards compatibility if needed
                teachersCount: teacherIds.length,
                upcomingLessons: filteredUpcomingLessons,
                unpaidLessons: unpaidForStudent,
                monthLessonsCount,
                totalLessonsCount: totalLessons,
                createdAt: userProfile?.createdAt,
                isStudent: true
            })
        }

        // Teacher logic (existing)
        const monthStartFull = startOfMonth(now)
        const monthEndFull = endOfMonth(now)

        const results = await Promise.all([
            prisma.student.count({ where: { ownerId: userId } }),
            prisma.subject.count({ where: { userId } }),
            prisma.group.count({ where: { ownerId: userId } }),
            prisma.lesson.count({
                where: { ownerId: userId, date: { lte: now }, isCanceled: false }
            }),
            prisma.lesson.count({
                where: { ownerId: userId, date: { gte: monthStartFull, lte: monthEndFull }, isCanceled: false }
            }),
            prisma.lesson.findMany({
                where: {
                    ownerId: userId,
                    date: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
                    isCanceled: false,
                },
                include: {
                    student: { select: { id: true, name: true } },
                    subject: { select: { id: true, name: true, color: true } },
                    group: { select: { id: true, name: true } },
                    lessonPayments: { select: { hasPaid: true } }
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
                },
                include: {
                    student: { select: { id: true, name: true } },
                    subject: { select: { id: true, name: true, color: true } },
                    group: { select: { id: true, name: true } },
                    lessonPayments: true
                },
                orderBy: { date: 'desc' },
                take: 15,
            }),
            prisma.lesson.findMany({
                where: {
                    ownerId: userId,
                    date: { gte: monthStartFull, lte: monthEndFull },
                    OR: [
                        { isPaid: true },
                        { lessonPayments: { some: { hasPaid: true } } }
                    ]
                },
                select: {
                    price: true,
                    isPaid: true,
                    groupId: true,
                    lessonPayments: { where: { hasPaid: true }, select: { hasPaid: true } }
                }
            }),
            (prisma as any).lessonRequest.findMany({
                where: { lesson: { ownerId: userId }, status: 'pending' },
                include: {
                    lesson: { include: { student: { select: { name: true } }, subject: { select: { name: true } }, group: { select: { name: true } } } },
                    user: { select: { name: true, firstName: true, email: true, avatar: true } }
                },
                orderBy: { createdAt: 'desc' },
                take: 10
            }),
            prisma.student.count({ where: { ownerId: userId, linkedUserId: { not: null } } }),
            prisma.learningPlan.count({ where: { ownerId: userId, studentId: { not: null } } }),
            prisma.learningPlan.count({ where: { ownerId: userId, groupId: { not: null } } }),
            prisma.user.findUnique({ where: { id: userId }, select: { createdAt: true } }),
            prisma.user.count({ where: { role: 'teacher' } }),
            prisma.lesson.groupBy({
                by: ['ownerId'],
                _count: { _all: true },
                where: { isCanceled: false }
            })
        ])

        const [
            countStudents,
            countSubjects,
            countGroups,
            totalLessons,
            monthLessonsCount,
            tUpcomingLessons,
            tRawUnpaidLessons,
            mIncomeData,
            pRequests,
            countConnectedStudents,
            countStudentPlans,
            countGroupPlans,
            uProfile,
            totalTeachers,
            allTeacherStats
        ] = results as any[]

        const unpaidLessons = tRawUnpaidLessons.filter((lesson: any) => {
            if (!lesson.group) return true
            const hasPayments = lesson.lessonPayments && lesson.lessonPayments.length > 0
            const totalStudents = hasPayments ? lesson.lessonPayments.length : (lesson.group.students?.length || 0)
            if (totalStudents === 0) return false
            const paidCount = lesson.lessonPayments?.filter((p: any) => p.hasPaid).length || 0
            return paidCount < totalStudents
        })

        const { isLessonPast } = await import('@/lib/lessonTimeUtils')
        const filteredUpcomingLessons = tUpcomingLessons
            .filter((lesson: any) => !isLessonPast(lesson.date, lesson.duration || 60))
            .slice(0, 5)

        const monthlyIncome = (mIncomeData as any[]).reduce((total, lesson) => {
            if (lesson.groupId) {
                return total + (lesson.lessonPayments.length * lesson.price)
            }
            return lesson.isPaid ? total + lesson.price : total
        }, 0)

        // Calculate rank
        const teacherLessonsMap = allTeacherStats.map((s: any) => ({
            ownerId: s.ownerId,
            count: s._count._all
        }))
        const sortedTeachers = teacherLessonsMap.sort((a: any, b: any) => b.count - a.count)
        const currentTeacherStats = sortedTeachers.find((s: any) => s.ownerId === userId)
        const myLessonCount = currentTeacherStats ? currentTeacherStats.count : 0
        const teacherRank = sortedTeachers.filter((s: any) => s.count > myLessonCount).length + 1

        const stats = {
            studentsCount: countStudents,
            groupsCount: countGroups,
            upcomingLessons: filteredUpcomingLessons,
            unpaidLessons,
            monthlyIncome,
            totalLessons,
            subjectsCount: countSubjects,
            monthLessonsCount,
            pendingRequests: pRequests,
            createdAt: uProfile?.createdAt,
            countConnectedStudents,
            countStudentPlans,
            countGroupPlans,
            teacherRank,
            totalTeachers
        }

        return NextResponse.json({ success: true, stats, ...stats })
    } catch (error) {
        console.error('Get stats error:', error)
        return NextResponse.json(
            { error: 'Произошла ошибка при получении статистики' },
            { status: 500 }
        )
    }
}
