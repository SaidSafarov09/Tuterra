import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/jwt'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { generateRecurringDates, validateRecurrenceRule } from '@/lib/recurring-lessons'
import type { RecurrenceRule } from '@/types/recurring'
import { generateLessonSlug } from '@/lib/slugUtils'
import { checkLessonOverlap, checkRecurringConflicts, formatConflictMessage } from '@/lib/lessonValidation'
import { checkAndGrantInviterBonus } from '@/lib/referral'
import { isStudentLocked, isGroupLocked, isPlanLocked } from '@/lib/guard'

export const dynamic = 'force-dynamic'

const recurrenceRuleSchema = z.object({
    enabled: z.boolean(),
    type: z.enum(['weekly', 'daily', 'every_x_weeks']),
    interval: z.number().int().min(1).default(1),
    daysOfWeek: z.union([z.array(z.number().int().min(0).max(6)), z.string()]).default([]),
    endType: z.enum(['never', 'until_date', 'count']),
    endDate: z.string().optional().transform(str => str ? new Date(str) : undefined),
    occurrencesCount: z.number().int().min(1).optional(),
})

const lessonSchema = z.object({
    studentId: z.string().optional(),
    groupId: z.string().optional(),
    subjectId: z.string().optional(),
    date: z.string().transform((str) => {
        const d = new Date(str)
        d.setSeconds(0, 0)
        return d
    }),
    price: z.number().nonnegative('Цена должна быть положительной'),
    isPaid: z.boolean().optional(),
    isCanceled: z.boolean().optional(),
    isTrial: z.boolean().optional(),
    notes: z.string().optional(),
    topic: z.string().optional(),
    duration: z.number().int().positive().default(60),
    recurrence: recurrenceRuleSchema.optional(),
    isPaidAll: z.boolean().optional(),
    seriesPrice: z.number().optional(),
    paidStudentIds: z.array(z.string()).optional(),
    planTopicId: z.string().optional().nullable().transform(val => val === '' ? null : val),
    link: z.string().optional().nullable(),
    rememberPrice: z.boolean().optional(),
}).refine(data => data.studentId || data.groupId, {
    message: "Необходимо выбрать ученика или группу",
    path: ["studentId"],
})

export async function GET(request: NextRequest) {
    try {
        const token = request.cookies.get('auth-token')?.value
        if (!token) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })

        const payload = await verifyToken(token)
        if (!payload) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })

        const { searchParams } = new URL(request.url)
        const filter = searchParams.get('filter')

        const now = new Date()
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        let where: any = { ownerId: payload.userId }

        if (filter === 'upcoming') {
            where.isCanceled = false
            where.date = { gte: oneDayAgo }
        } else if (filter === 'past') {
            where.isCanceled = false
            where.date = { lt: now }
        } else if (filter === 'unpaid') {
            where.isPaid = false
            where.isCanceled = false
            where.price = { gt: 0 }
        } else if (filter === 'canceled') {
            where.isCanceled = true
        }

        let lessons = await prisma.lesson.findMany({
            where,
            include: {
                student: { select: { id: true, name: true, contact: true } },
                group: {
                    include: {
                        students: { select: { id: true, name: true } }
                    }
                },
                subject: { select: { id: true, name: true, color: true } },
                lessonPayments: { select: { studentId: true, hasPaid: true } },
            },
            orderBy: { date: filter === 'past' ? 'desc' : 'asc' },
            take: 300,
        })

        // Filter for precise boundaries if needed (ongoing lessons etc)
        if (filter === 'upcoming' || filter === 'past') {
            const { isLessonPast } = await import('@/lib/lessonTimeUtils')
            lessons = lessons.filter(lesson => {
                const lessonIsPast = isLessonPast(lesson.date, lesson.duration || 60)
                return filter === 'upcoming' ? !lessonIsPast : lessonIsPast
            })
        }

        if (filter === 'unpaid') {
            lessons = lessons.filter(lesson => {
                if (lesson.group && lesson.lessonPayments && lesson.lessonPayments.length > 0) {
                    const paidCount = lesson.lessonPayments.filter(p => p.hasPaid).length
                    // Only count if there are actual payments recorded
                    if (paidCount >= lesson.lessonPayments.length) {
                        return false
                    }
                }
                return true
            })
        }

        return NextResponse.json(lessons)
    } catch (error) {
        console.error('Get lessons error:', error)
        return NextResponse.json(
            { error: 'Произошла ошибка при получении списка занятий' },
            { status: 500 }
        )
    }
}

export async function POST(request: NextRequest) {
    try {
        const token = request.cookies.get('auth-token')?.value
        if (!token) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })

        const payload = await verifyToken(token)
        if (!payload) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })

        const body = await request.json()
        const validatedData = lessonSchema.parse(body)

        if (validatedData.studentId) {
            const student = await prisma.student.findFirst({
                where: {
                    id: validatedData.studentId,
                    ownerId: payload.userId,
                },
                include: {
                    subjects: {
                        include: {
                            _count: {
                                select: { students: true, lessons: true }
                            }
                        }
                    }
                }
            })

            if (!student) {
                return NextResponse.json(
                    { error: 'Ученик не найден' },
                    { status: 404 }
                )
            }

            if (await isStudentLocked(validatedData.studentId, payload.userId)) {
                return NextResponse.json(
                    { error: 'Данный ученик заблокирован (превышен лимит бесплатного тарифа). Продлите PRO доступ.' },
                    { status: 403 }
                )
            }
        } else if (validatedData.groupId) {
            const group = await prisma.group.findFirst({
                where: {
                    id: validatedData.groupId,
                    ownerId: payload.userId,
                }
            })
            if (!group) {
                return NextResponse.json(
                    { error: 'Группа не найдена' },
                    { status: 404 }
                )
            }

            if (await isGroupLocked(validatedData.groupId, payload.userId)) {
                return NextResponse.json(
                    { error: 'Данная группа заблокирована (превышен лимит бесплатного тарифа). Продлите PRO доступ.' },
                    { status: 403 }
                )
            }
        }

        if (validatedData.planTopicId) {
            const topic = await prisma.learningPlanTopic.findUnique({
                where: { id: validatedData.planTopicId },
                select: { planId: true }
            })
            if (topic && await isPlanLocked(topic.planId, payload.userId)) {
                return NextResponse.json(
                    { error: 'Данный план обучения заблокирован. Продлите PRO доступ для использования тем из него.' },
                    { status: 403 }
                )
            }
        }


        const priceToSave = validatedData.seriesPrice ?? (!validatedData.isTrial ? validatedData.price : undefined);

        if (validatedData.rememberPrice && priceToSave !== undefined) {
            if (validatedData.studentId) {
                await prisma.student.update({
                    where: { id: validatedData.studentId, ownerId: payload.userId },
                    data: { defaultPrice: priceToSave } as any
                })
            } else if (validatedData.groupId) {
                await prisma.group.update({
                    where: { id: validatedData.groupId, ownerId: payload.userId },
                    data: { defaultPrice: priceToSave } as any
                })
            }
        }

        if (validatedData.recurrence?.enabled) {
            return await createRecurringLesson(payload.userId, validatedData)
        }


        return await createSingleLesson(payload.userId, validatedData)

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: error.errors[0].message },
                { status: 400 }
            )
        }

        console.error('Create lesson error:', error)
        return NextResponse.json(
            { error: 'Произошла ошибка при создании занятия: ' + (error as Error).message },
            { status: 500 }
        )
    }
}
async function createSingleLesson(userId: string, data: z.infer<typeof lessonSchema>) {
    // Получаем timezone пользователя для корректного отображения времени в сообщениях
    const userTz = await prisma.user.findUnique({
        where: { id: userId },
        select: { timezone: true }
    })
    const timezone = userTz?.timezone || 'Europe/Moscow'

    const conflict = await checkLessonOverlap(userId, data.date, data.duration)
    if (conflict) {
        return NextResponse.json(
            { error: formatConflictMessage(conflict, data.studentId, timezone) },
            { status: 400 }
        )
    }

    // Fetch required data in parallel
    const [subject, group] = await Promise.all([
        data.subjectId ? prisma.subject.findUnique({ where: { id: data.subjectId } }) : Promise.resolve(null),
        data.groupId ? prisma.group.findUnique({
            where: { id: data.groupId },
            include: { students: { select: { id: true } } }
        }) : Promise.resolve(null)
    ])

    const subjectName = subject?.name || null
    const subjectColor = subject?.color || null
    const groupName = group?.name || null
    const groupStudents = group?.students || []

    const entityName = groupName || (data.studentId ? (await prisma.student.findUnique({ where: { id: data.studentId }, select: { name: true } }))?.name : null) || 'Занятие'
    const slug = generateLessonSlug(entityName, data.date, data.topic || undefined)

    const lesson = await prisma.lesson.create({
        data: {
            slug,
            date: data.date,
            price: data.price,
            isPaid: data.isPaid || false,
            isCanceled: data.isCanceled || false,
            isTrial: data.isTrial || false,
            notes: data.notes,
            topic: data.topic,
            duration: data.duration,
            ownerId: userId,
            studentId: data.studentId,
            groupId: data.groupId,
            groupName,
            subjectId: data.subjectId,
            subjectName,
            subjectColor,
            planTopicId: data.planTopicId,
            link: data.link,
            lessonPayments: data.groupId ? {
                create: groupStudents.map(student => ({
                    studentId: student.id,
                    hasPaid: data.paidStudentIds?.includes(student.id) || false
                }))
            } : undefined
        } as any,
        include: {
            owner: true,
            student: true,
            group: { include: { students: true } },
            subject: true,
            lessonPayments: true,
        },
    })

    if (data.subjectId && data.studentId) {
        await linkSubjectToStudent(data.studentId, data.subjectId)
    }

    const { notifyLessonCreated } = await import('@/lib/lesson-actions-server')
    await notifyLessonCreated(userId, lesson, false, 1, timezone)

    // Also notify the student if they are linked to a user
    if (lesson.student?.linkedUserId) {
        await notifyLessonCreated(lesson.student.linkedUserId, lesson, false, 1, timezone)
    }
    // If it's a group, notify all students who have linked users
    if (lesson.group?.students) {
        for (const student of lesson.group.students) {
            if (student.linkedUserId) {
                await notifyLessonCreated(student.linkedUserId, lesson, false, 1, timezone)
            }
        }
    }

    // Trigger referral check
    checkAndGrantInviterBonus(userId).catch(e => console.error('Referral check error:', e))

    return NextResponse.json(lesson, { status: 201 })
}

async function createRecurringLesson(userId: string, data: z.infer<typeof lessonSchema>) {
    const recurrence = data.recurrence!
    const validation = validateRecurrenceRule(recurrence)
    if (!validation.valid) {
        return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const startDate = new Date(data.date)
    let year = startDate.getFullYear()
    if (startDate.getMonth() >= 5) { // Июнь или позже - учебный год заканчивается в следующем календарном году
        year += 1
    }
    const schoolYearEnd = new Date(year, 4, 31, 23, 59, 59)

    const dates = generateRecurringDates({
        startDate: startDate,
        rule: recurrence,
        limit: 300,
        endDate: schoolYearEnd,
    })

    const [conflict, group, userTz] = await Promise.all([
        checkRecurringConflicts(userId, dates, data.duration),
        data.groupId ? prisma.group.findUnique({
            where: { id: data.groupId },
            include: { students: { select: { id: true } } }
        }) : Promise.resolve(null),
        prisma.user.findUnique({
            where: { id: userId },
            select: { timezone: true }
        })
    ])

    const timezone = userTz?.timezone || 'Europe/Moscow'

    if (conflict) {
        return NextResponse.json(
            { error: formatConflictMessage(conflict, data.studentId, timezone) },
            { status: 400 }
        )
    }

    const groupName = group?.name || null
    const groupStudents = group?.students || []

    const result = await prisma.$transaction(async (tx) => {
        const series = await tx.lessonSeries.create({
            data: {
                userId,
                type: recurrence.type,
                interval: recurrence.interval,
                daysOfWeek: typeof recurrence.daysOfWeek === 'string'
                    ? recurrence.daysOfWeek
                    : JSON.stringify(recurrence.daysOfWeek),
                startDate: data.date,
                endDate: recurrence.endDate,
                occurrencesCount: recurrence.occurrencesCount,
                studentId: data.studentId,
                groupId: data.groupId,
                subjectId: data.subjectId,
                price: data.price,
                topic: data.topic,
                duration: data.duration,
                notes: data.notes,
            } as any,
        })

        const lessonsData = dates.map((date, index) => ({
            date,
            price: index === 0 ? data.price : (data.seriesPrice !== undefined ? data.seriesPrice : data.price),
            isPaid: data.isPaidAll || (data.paidStudentIds && data.paidStudentIds.length > 0) ? true : (index === 0 ? (data.isPaid || false) : false),
            isTrial: index === 0 ? (data.isTrial || false) : false,
            isCanceled: false,
            notes: data.notes,
            topic: data.topic,
            duration: data.duration,
            ownerId: userId,
            studentId: data.studentId,
            groupId: data.groupId,
            groupName,
            subjectId: data.subjectId,
            seriesId: series.id,
            planTopicId: data.planTopicId,
            slug: generateLessonSlug(groupName || 'Lesson', date, data.topic || undefined)
        }))

        // createMany is not supported in all environments with returning data,
        // but since we provided the seriesId, we can find them.
        await tx.lesson.createMany({ data: lessonsData })

        // If it's a group, we need to batch create lesson payments for ALL students for ALL lessons
        if (data.groupId && groupStudents.length > 0) {
            const createdLessons = await tx.lesson.findMany({
                where: { seriesId: series.id },
                select: { id: true }
            })

            const paymentsData = []
            for (const lesson of createdLessons) {
                for (const student of groupStudents) {
                    paymentsData.push({
                        lessonId: lesson.id,
                        studentId: student.id,
                        hasPaid: data.paidStudentIds?.includes(student.id) || false
                    })
                }
            }

            if (paymentsData.length > 0) {
                await tx.lessonPayment.createMany({ data: paymentsData })
            }
        }

        if (data.subjectId && data.studentId) {
            await tx.student.update({
                where: { id: data.studentId },
                data: {
                    subjects: {
                        connect: { id: data.subjectId },
                    },
                },
            }).catch(() => { /* simple ignore if already linked */ })
        }

        const firstLesson = await tx.lesson.findFirst({
            where: { seriesId: series.id },
            include: {
                owner: true,
                student: true,
                group: { include: { students: true } },
                subject: true,
                lessonPayments: true,
            },
            orderBy: { date: 'asc' },
        })

        return { firstLesson, seriesId: series.id }
    })

    if (result.firstLesson) {
        const { notifyLessonCreated } = await import('@/lib/lesson-actions-server')
        await notifyLessonCreated(userId, result.firstLesson, true, dates.length, timezone)

        // Notify student or group members
        if (result.firstLesson.student?.linkedUserId) {
            await notifyLessonCreated(result.firstLesson.student.linkedUserId, result.firstLesson, true, dates.length, timezone)
        }
        if (result.firstLesson.group?.students) {
            for (const student of result.firstLesson.group.students) {
                if (student.linkedUserId) {
                    await notifyLessonCreated(student.linkedUserId, result.firstLesson, true, dates.length, timezone)
                }
            }
        }
        checkAndGrantInviterBonus(userId).catch(e => console.error('Referral check error:', e))
    }

    return NextResponse.json({
        ...result.firstLesson,
        _meta: {
            isRecurring: true,
            totalLessons: dates.length,
        }
    }, { status: 201 })
}

async function linkSubjectToStudent(studentId: string, subjectId: string) {
    try {
        await prisma.student.update({
            where: { id: studentId },
            data: {
                subjects: {
                    connect: { id: subjectId },
                },
            },
        })
    } catch (error) {
        console.log('Subject linking attempt result:', error)
    }
}
