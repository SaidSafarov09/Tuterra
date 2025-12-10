import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/jwt'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { generateRecurringDates, validateRecurrenceRule } from '@/lib/recurring-lessons'
import type { RecurrenceRule } from '@/types/recurring'
import { generateLessonSlug } from '@/lib/slugUtils'
import { checkLessonOverlap, checkRecurringConflicts, formatConflictMessage } from '@/lib/lessonValidation'

export const dynamic = 'force-dynamic'

const recurrenceRuleSchema = z.object({
    enabled: z.boolean(),
    type: z.enum(['weekly', 'daily', 'every_x_weeks']),
    interval: z.number().int().min(1).default(1),
    daysOfWeek: z.array(z.number().int().min(0).max(6)).default([]),
    endType: z.enum(['never', 'until_date', 'count']),
    endDate: z.string().optional().transform(str => str ? new Date(str) : undefined),
    occurrencesCount: z.number().int().min(1).optional(),
})

const lessonSchema = z.object({
    studentId: z.string(),
    subjectId: z.string().optional(),
    date: z.string().transform((str) => new Date(str)),
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
        let where: any = { ownerId: payload.userId }

        if (filter === 'upcoming') {
            where.date = { gte: now }
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
                subject: true,
            },
            orderBy: { date: filter === 'past' ? 'desc' : 'asc' },
        })

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
    const conflict = await checkLessonOverlap(userId, data.date, data.duration)
    if (conflict) {
        return NextResponse.json(
            { error: formatConflictMessage(conflict, data.studentId) },
            { status: 400 }
        )
    }

    let subjectName = null
    let subjectColor = null
    if (data.subjectId) {
        const subject = await prisma.subject.findUnique({
            where: { id: data.subjectId }
        })
        if (subject) {
            subjectName = subject.name
            subjectColor = subject.color
        }
    }

    const lesson = await prisma.lesson.create({
        data: {
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
            subjectId: data.subjectId,
            subjectName,
            subjectColor,
        } as any,
        include: {
            student: true,
            subject: true,
        },
    })
    const student = lesson.studentId ? await prisma.student.findUnique({
        where: { id: lesson.studentId }
    }) : null

    const slug = student ? generateLessonSlug(student.name, new Date(lesson.date), lesson.topic || undefined) : undefined
    const updatedLesson = await prisma.lesson.update({
        where: { id: lesson.id },
        data: { slug } as any,
        include: {
            student: true,
            subject: true,
        },
    })
    if (data.subjectId) {
        await linkSubjectToStudent(data.studentId, data.subjectId)
    }

    return NextResponse.json(updatedLesson, { status: 201 })
}

async function createRecurringLesson(userId: string, data: z.infer<typeof lessonSchema>) {
    const recurrence = data.recurrence!
    const validation = validateRecurrenceRule(recurrence)
    if (!validation.valid) {
        return NextResponse.json(
            { error: validation.error },
            { status: 400 }
        )
    }
    const threeMonthsFromNow = new Date()
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3)

    const dates = generateRecurringDates({
        startDate: data.date,
        rule: recurrence,
        limit: 100,
        endDate: threeMonthsFromNow,
    })

    const conflict = await checkRecurringConflicts(userId, dates, data.duration)
    if (conflict) {
        return NextResponse.json(
            { error: formatConflictMessage(conflict, data.studentId) },
            { status: 400 }
        )
    }
    const series = await prisma.lessonSeries.create({
        data: {
            userId,
            type: recurrence.type,
            interval: recurrence.interval,
            daysOfWeek: recurrence.daysOfWeek,
            startDate: data.date,
            endDate: recurrence.endDate,
            occurrencesCount: recurrence.occurrencesCount,
            studentId: data.studentId,
            subjectId: data.subjectId,
            price: data.price,
            topic: data.topic,
            duration: data.duration,
            notes: data.notes,
        } as any,
    })
    const lessons = await prisma.lesson.createMany({
        data: dates.map((date, index) => ({
            date,
            price: index === 0 ? data.price : (data.seriesPrice !== undefined ? data.seriesPrice : data.price),

            isPaid: data.isPaidAll ? true : (index === 0 ? (data.isPaid || false) : false),
            isTrial: index === 0 ? (data.isTrial || false) : false,
            isCanceled: false,
            notes: data.notes,
            topic: data.topic,
            duration: data.duration,
            ownerId: userId,
            studentId: data.studentId,
            subjectId: data.subjectId,
            seriesId: series.id,
        })),
    })
    if (data.subjectId) {
        await linkSubjectToStudent(data.studentId, data.subjectId)
    }
    const firstLesson = await prisma.lesson.findFirst({
        where: { seriesId: series.id },
        include: {
            student: true,
            subject: true,
        },
        orderBy: { date: 'asc' },
    })

    return NextResponse.json({
        ...firstLesson,
        _meta: {
            isRecurring: true,
            totalLessons: lessons.count,
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
