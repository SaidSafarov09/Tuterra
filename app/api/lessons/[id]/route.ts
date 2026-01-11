import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { isCuid } from '@/lib/slugUtils'
import { sendTelegramNotification } from '@/lib/telegram'
import { isStudentLocked, isGroupLocked } from '@/lib/guard'

const lessonSchema = z.object({
    studentId: z.string().optional(),
    groupId: z.string().optional(),
    date: z.string().transform((str) => {
        const d = new Date(str)
        d.setSeconds(0, 0)
        return d
    }),
    price: z.number().nonnegative('Цена должна быть положительной'),
    isPaid: z.boolean(),
    isCanceled: z.boolean().optional(),
    isTrial: z.boolean().optional(),
    notes: z.string().optional(),
    topic: z.string().optional(),
    duration: z.number().int().positive().optional(),
    paidStudentIds: z.array(z.string()).optional(),
    attendedStudentIds: z.array(z.string()).optional(),
    planTopicId: z.string().optional().nullable().transform(val => val === '' ? null : val),
    link: z.string().optional().nullable(),
    seriesPrice: z.number().optional(),
    rememberPrice: z.boolean().optional(),
})

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {

    try {
        const { id } = await params
        const user = await getCurrentUser(request)

        if (!user) {
            return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
        }


        const isId = isCuid(id)
        const isStudent = user.role === 'student'

        let whereClause: any
        if (isStudent) {
            const studentRecords = await prisma.student.findMany({
                where: { linkedUserId: user.id },
                select: { id: true }
            })
            const studentIds = studentRecords.map(s => s.id)

            whereClause = {
                AND: [
                    isId ? { id: id } : { slug: id },
                    {
                        OR: [
                            { studentId: { in: studentIds } },
                            { group: { students: { some: { id: { in: studentIds } } } } }
                        ]
                    }
                ]
            }
        } else {
            whereClause = {
                OR: [
                    { id: id },
                    { slug: id }
                ],
                ownerId: user.id
            }
        }

        const lesson = await prisma.lesson.findFirst({
            where: whereClause,
            include: {
                student: true,
                subject: true,
                owner: true,
                group: {
                    include: {
                        students: true
                    }
                },
                lessonPayments: {
                    include: {
                        student: true
                    }
                },
            },
        })

        if (!lesson) {
            return NextResponse.json({ error: 'Занятие не найдено' }, { status: 404 })
        }

        // Add student-specific fields if requested by a student
        if (isStudent) {
            const studentRecords = await prisma.student.findMany({
                where: { linkedUserId: user.id },
                select: { id: true }
            })
            const studentIds = studentRecords.map(s => s.id)

            const userHasPaid = lesson.studentId
                ? lesson.isPaid
                : lesson.lessonPayments.some(p => studentIds.includes(p.studentId) && p.hasPaid)

            return NextResponse.json({
                ...lesson,
                userHasPaid
            })
        }

        // Just return the lesson directly, no need for redirect in API
        return NextResponse.json(lesson)
    } catch (error) {
        console.error('Get lesson error:', error)
        return NextResponse.json(
            { error: 'Произошла ошибка при получении данных занятия' },
            { status: 500 }
        )
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const user = await getCurrentUser(request)
        if (!user) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })

        const body = await request.json()
        const currentLesson = await prisma.lesson.findFirst({
            where: {
                OR: [
                    { id: id },
                    { slug: id }
                ],
                ownerId: user.id
            },
            include: { owner: true, student: true, subject: true, group: { include: { students: true } } }
        })
        if (!currentLesson) return NextResponse.json({ error: 'Занятие не найдено' }, { status: 404 })
        const lessonId = currentLesson.id

        const validatedData = lessonSchema.parse(body)

        // Validate student or group existence
        if (validatedData.studentId) {
            const student = await prisma.student.findFirst({
                where: { id: validatedData.studentId, ownerId: user.id },
            })
            if (!student) return NextResponse.json({ error: 'Ученик не найден' }, { status: 404 })
        }
        if (validatedData.groupId) {
            const group = await prisma.group.findFirst({
                where: { id: validatedData.groupId, ownerId: user.id },
            })
            if (!group) return NextResponse.json({ error: 'Группа не найдена' }, { status: 404 })
        }

        const userDb = await prisma.user.findUnique({ where: { id: user.id }, select: { timezone: true, proExpiresAt: true } })
        const timezone = userDb?.timezone || 'Europe/Moscow'

        // Check if student or group is locked
        // Allow editing if lesson falls within valid subscription period (or on the expiry day)
        const isCoveredByPro = userDb?.proExpiresAt && currentLesson.date <= userDb.proExpiresAt

        if (!isCoveredByPro) {
            if (currentLesson.studentId && await isStudentLocked(currentLesson.studentId, user.id)) {
                return NextResponse.json({ error: 'Данный ученик заблокирован. Продлите PRO.' }, { status: 403 })
            }
            if (currentLesson.groupId && await isGroupLocked(currentLesson.groupId, user.id)) {
                return NextResponse.json({ error: 'Данная группа заблокирована. Продлите PRO.' }, { status: 403 })
            }
        }



        const { checkLessonOverlap, formatConflictMessage } = await import('@/lib/lessonValidation')
        const conflict = await checkLessonOverlap(user.id, validatedData.date, validatedData.duration || 60, lessonId)
        if (conflict) {
            return NextResponse.json({ error: formatConflictMessage(conflict, validatedData.studentId, timezone) }, { status: 400 })
        }

        if (currentLesson.date.getTime() !== validatedData.date.getTime()) {
            const { notifyLessonRescheduled } = await import('@/lib/lesson-actions-server')
            await notifyLessonRescheduled(user.id, currentLesson.date, validatedData.date, currentLesson, timezone)

            // Also notify the student if they are linked to a user
            if (currentLesson.student?.linkedUserId) {
                await notifyLessonRescheduled(currentLesson.student.linkedUserId, currentLesson.date, validatedData.date, currentLesson, timezone)
            }
            // If it's a group, notify all students who have linked users
            if (currentLesson.group?.students) {
                for (const student of currentLesson.group.students) {
                    if (student.linkedUserId) {
                        await notifyLessonRescheduled(student.linkedUserId, currentLesson.date, validatedData.date, currentLesson, timezone)
                    }
                }
            }
        }

        const isTrial = validatedData.isTrial ?? currentLesson.isTrial;
        const priceToSave = validatedData.seriesPrice ?? (!isTrial ? validatedData.price : undefined);

        if (validatedData.rememberPrice && priceToSave !== undefined) {
            const studentId = validatedData.studentId || currentLesson.studentId
            const groupId = validatedData.groupId || currentLesson.groupId
            if (studentId) {
                await prisma.student.update({
                    where: { id: studentId, ownerId: user.id },
                    data: { defaultPrice: priceToSave } as any
                })
            } else if (groupId) {
                await prisma.group.update({
                    where: { id: groupId, ownerId: user.id },
                    data: { defaultPrice: priceToSave } as any
                })
            }
        }

        const { paidStudentIds, attendedStudentIds, planTopicId, seriesPrice: _, rememberPrice: __, ...lessonData } = validatedData

        // Explicitly handle student/group switching to avoid having both
        const finalUpdateData = {
            ...lessonData,
            planTopicId,
            studentId: validatedData.studentId || (validatedData.groupId ? null : currentLesson.studentId),
            groupId: validatedData.groupId || (validatedData.studentId ? null : currentLesson.groupId),
        }

        await prisma.lesson.update({
            where: { id: lessonId },
            data: finalUpdateData as any,
        })

        if (paidStudentIds !== undefined || attendedStudentIds !== undefined) {
            const { updateLessonPayments } = await import('@/lib/lesson-actions-server')
            await updateLessonPayments(lessonId, paidStudentIds, attendedStudentIds, {
                ...currentLesson,
                studentId: validatedData.studentId || currentLesson.studentId,
                groupId: validatedData.groupId || currentLesson.groupId
            })
        }

        const updatedLesson = await prisma.lesson.findUnique({
            where: { id: lessonId },
            include: {
                student: true,
                group: { include: { students: true } },
                subject: true,
                lessonPayments: { include: { student: true } },
            },
        })
        return NextResponse.json(updatedLesson)
    } catch (error) {
        if (error instanceof z.ZodError) return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
        console.error('Update lesson error:', error)
        return NextResponse.json({ error: 'Произошла ошибка при обновлении занятия' }, { status: 500 })
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const user = await getCurrentUser(request)
        if (!user) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })

        const body = await request.json()
        const currentLesson = await prisma.lesson.findFirst({
            where: {
                OR: [
                    { id: id },
                    { slug: id }
                ],
                ownerId: user.id
            },
            include: { student: true, subject: true, group: { include: { students: true } } }
        })
        if (!currentLesson) return NextResponse.json({ error: 'Занятие не найдено' }, { status: 404 })
        const lessonId = currentLesson.id


        const userDb = await prisma.user.findUnique({ where: { id: user.id }, select: { timezone: true, proExpiresAt: true } })
        const timezone = userDb?.timezone || 'Europe/Moscow'

        // Check if student or group is locked
        // Allow editing if lesson falls within valid subscription period (or on the expiry day)
        const isCoveredByPro = userDb?.proExpiresAt && currentLesson.date <= userDb.proExpiresAt

        if (!isCoveredByPro) {
            if (currentLesson.studentId && await isStudentLocked(currentLesson.studentId, user.id)) {
                return NextResponse.json({ error: 'Данный ученик заблокирован. Продлите PRO.' }, { status: 403 })
            }
            if (currentLesson.groupId && await isGroupLocked(currentLesson.groupId, user.id)) {
                return NextResponse.json({ error: 'Данная группа заблокирована. Продлите PRO.' }, { status: 403 })
            }
        }

        const updateData: any = {}
        const fields = ['isPaid', 'price', 'studentId', 'groupId', 'subjectId', 'isCanceled', 'isTrial', 'notes', 'topic', 'duration', 'planTopicId', 'link']
        fields.forEach(f => { if (body[f] !== undefined) updateData[f] = body[f] })
        if (body.date !== undefined) {
            updateData.date = new Date(body.date)
            updateData.date.setSeconds(0, 0)
        }



        if (updateData.date || updateData.duration) {
            const { checkLessonOverlap, formatConflictMessage } = await import('@/lib/lessonValidation')
            const conflict = await checkLessonOverlap(user.id, updateData.date || currentLesson.date, updateData.duration || currentLesson.duration, lessonId)
            if (conflict) {
                return NextResponse.json({ error: formatConflictMessage(conflict, updateData.studentId || currentLesson.studentId, timezone) }, { status: 400 })
            }
            if (updateData.date && updateData.date.getTime() !== currentLesson.date.getTime()) {
                const { notifyLessonRescheduled } = await import('@/lib/lesson-actions-server')
                await notifyLessonRescheduled(user.id, currentLesson.date, updateData.date, currentLesson, timezone)

                // Also notify the student if they are linked to a user
                if (currentLesson.student?.linkedUserId) {
                    await notifyLessonRescheduled(currentLesson.student.linkedUserId, currentLesson.date, updateData.date, currentLesson, timezone)
                }
                // If it's a group, notify all students who have linked users
                if (currentLesson.group?.students) {
                    for (const student of currentLesson.group.students) {
                        if (student.linkedUserId) {
                            await notifyLessonRescheduled(student.linkedUserId, currentLesson.date, updateData.date, currentLesson, timezone)
                        }
                    }
                }
            }
        }

        if (updateData.isCanceled !== undefined && updateData.isCanceled !== currentLesson.isCanceled) {
            const { notifyLessonStatusChanged } = await import('@/lib/lesson-actions-server')
            const status = updateData.isCanceled ? 'canceled' : 'restored'

            await notifyLessonStatusChanged(user.id, currentLesson, status, timezone)

            if (currentLesson.student?.linkedUserId) {
                await notifyLessonStatusChanged(currentLesson.student.linkedUserId, currentLesson, status, timezone)
            }
            if (currentLesson.group?.students) {
                for (const student of currentLesson.group.students) {
                    if (student.linkedUserId) {
                        await notifyLessonStatusChanged(student.linkedUserId, currentLesson, status, timezone)
                    }
                }
            }
        }

        if (Object.keys(updateData).length > 0) {
            await prisma.lesson.update({ where: { id: lessonId }, data: updateData })
        }

        if (body.paidStudentIds !== undefined || body.attendedStudentIds !== undefined) {
            const { updateLessonPayments } = await import('@/lib/lesson-actions-server')
            await updateLessonPayments(lessonId, body.paidStudentIds, body.attendedStudentIds, {
                ...currentLesson,
                studentId: updateData.studentId || currentLesson.studentId,
                groupId: updateData.groupId || currentLesson.groupId
            })
        }

        const updatedLesson = await prisma.lesson.findUnique({
            where: { id: lessonId },
            include: {
                student: true,
                group: { include: { students: true } },
                subject: true,
                lessonPayments: { include: { student: true } },
            },
        })
        return NextResponse.json(updatedLesson)
    } catch (error) {
        console.error('Patch lesson error:', error)
        return NextResponse.json({ error: 'Произошла ошибка при обновлении занятия' }, { status: 500 })
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const user = await getCurrentUser(request)

        if (!user) {
            return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const scope = searchParams.get('scope')

        const lesson = await prisma.lesson.findFirst({
            where: {
                OR: [
                    { id: id },
                    { slug: id }
                ],
                ownerId: user.id
            },
            include: { owner: true, student: true, group: { include: { students: true } }, subject: true }
        })

        if (!lesson) {
            return NextResponse.json({ error: 'Занятие не найдено' }, { status: 404 })
        }

        const lessonWithSeries = lesson as any

        if (scope === 'series' && lessonWithSeries.seriesId) {
            const now = new Date()

            // Delete only future lessons in the series
            await prisma.lesson.deleteMany({
                where: {
                    seriesId: lessonWithSeries.seriesId,
                    ownerId: user.id,
                    date: {
                        gte: now
                    }
                } as any,
            })

            // Check if any lessons remain in this series
            const remainingLessonsCount = await prisma.lesson.count({
                where: {
                    seriesId: lessonWithSeries.seriesId,
                    ownerId: user.id,
                }
            })

            // Only delete the series record if no lessons (past or future) remain
            if (remainingLessonsCount === 0) {
                await (prisma as any).lessonSeries.delete({
                    where: {
                        id: lessonWithSeries.seriesId,
                        userId: user.id,
                    },
                })
            }
        } else {
            await prisma.lesson.delete({
                where: {
                    id: lesson.id,
                },
                include: { student: true, group: true, subject: true }
            })
        }

        const { notifyLessonDeleted } = await import('@/lib/lesson-actions-server')
        const isSeries = scope === 'series'

        // 1. Notify the teacher
        await notifyLessonDeleted(user.id, lesson, isSeries)

        // 2. Notify the student if they are linked
        if (lesson.student?.linkedUserId) {
            await notifyLessonDeleted(lesson.student.linkedUserId, lesson, isSeries)
        }

        // 3. Notify group students who are linked
        if (lesson.group?.students) {
            for (const student of lesson.group.students) {
                if (student.linkedUserId) {
                    await notifyLessonDeleted(student.linkedUserId, lesson, isSeries)
                }
            }
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Delete lesson error:', error)
        return NextResponse.json(
            { error: 'Произошла ошибка при удалении занятия' },
            { status: 500 }
        )
    }
}
