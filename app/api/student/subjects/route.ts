import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/jwt'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    try {
        const token = request.cookies.get('auth-token')?.value
        if (!token) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })

        const payload = await verifyToken(token)
        if (!payload || payload.role !== 'student') {
            return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
        }

        // Find all students linked to this user
        const linkedStudents = await prisma.student.findMany({
            where: { linkedUserId: payload.userId },
            include: {
                groups: {
                    include: {
                        lessons: {
                            include: {
                                lessonPayments: true
                            },
                            orderBy: { date: 'asc' },
                            take: 50
                        },
                        _count: {
                            select: { students: true }
                        }
                    }
                },
                lessons: {
                    where: { isCanceled: false },
                    orderBy: { date: 'asc' },
                    take: 20
                },
                subjects: {
                    include: {
                        user: {
                            select: { name: true, firstName: true }
                        },
                        _count: {
                            select: { lessons: true }
                        }
                    }
                }
            }
        })

        // Extract unique subjects and attach related entities (Group or Self)
        const subjectsMap = new Map();
        linkedStudents.forEach(student => {
            student.subjects.forEach(subject => {
                if (!subjectsMap.has(subject.id)) {
                    // Determine if student is in a group for this subject
                    const relatedGroup = student.groups.find(g => g.subjectId === subject.id);

                    let filteredGroupLessons: any[] = []
                    if (relatedGroup) {
                        const now = new Date()
                        filteredGroupLessons = relatedGroup.lessons.filter(l => {
                            // Future -> Show
                            if (new Date(l.date) >= now) return true
                            // Past -> Show only if paid/attended (payment record exists for this student)
                            const hasPayment = l.lessonPayments.some((p: any) => p.studentId === student.id)
                            return hasPayment
                        })
                    }

                    // Filter lessons for this subject (for private "student" entity)
                    const relatedStudentLessons = student.lessons.filter(l => l.subjectId === subject.id);

                    subjectsMap.set(subject.id, {
                        ...subject,
                        teacherName: subject.user?.name || subject.user?.firstName || 'Преподаватель',
                        // Attach data for "Teacher-Mode" Modal
                        relatedGroup: relatedGroup ? {
                            id: relatedGroup.id,
                            name: relatedGroup.name,
                            students: Array(relatedGroup._count.students).fill({ id: 'dummy' }), // Fake students array for count display
                            lessons: filteredGroupLessons
                        } : null,
                        relatedStudent: !relatedGroup ? {
                            id: student.id,
                            name: student.name, // Or student.name, but user wants to differentiate context
                            slug: student.id, // for link
                            lessons: relatedStudentLessons
                        } : null
                    });
                }
            });
        });

        const studentIds = linkedStudents.map(s => s.id)

        // Fetch all relevant lessons for these students to count them by subject
        const allStudentLessons = await prisma.lesson.findMany({
            where: {
                OR: [
                    { studentId: { in: studentIds } },
                    { group: { students: { some: { id: { in: studentIds } } } } }
                ],
                isCanceled: false
            },
            include: {
                lessonPayments: {
                    where: { studentId: { in: studentIds } }
                }
            }
        })

        // Count lessons per subject, applying the "visibility" filter
        const subjectLessonCounts = new Map<string, number>()

        allStudentLessons.forEach(lesson => {
            if (!lesson.subjectId) return

            // Visibility check (same as stats)
            let isVisible = true
            if (lesson.groupId) {
                const myPayment = lesson.lessonPayments?.[0]
                if (!myPayment) {
                    // No payment record
                    const isPast = new Date(lesson.date) < new Date()
                    if (isPast) isVisible = false // Ghost lesson
                } else {
                    // Has payment record - currently we show even if not paid (as Unpaid), or paid (as Paid)
                    // So visible unless we want to hide "Not Paid" which we don't.
                }
            }

            if (isVisible) {
                subjectLessonCounts.set(lesson.subjectId, (subjectLessonCounts.get(lesson.subjectId) || 0) + 1)
            }
        })

        const subjects = Array.from(subjectsMap.values()).map((subject: any) => ({
            ...subject,
            lessonsCount: subjectLessonCounts.get(subject.id) || 0
        }));

        return NextResponse.json(subjects)
    } catch (error) {
        console.error('Get student subjects error:', error)
        return NextResponse.json(
            { error: 'Произошла ошибка при получении списка предметов' },
            { status: 500 }
        )
    }
}
