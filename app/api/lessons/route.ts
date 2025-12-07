import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/jwt'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { generateRecurringDates, validateRecurrenceRule } from '@/lib/recurring-lessons'
import type { RecurrenceRule } from '@/types/recurring'
import { generateLessonSlug } from '@/lib/slugUtils'

export const dynamic = 'force-dynamic'

// DRY: Reusable schema for recurrence rule
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
        } else if (filter === 'canceled') {
            where.isCanceled = true
        }

        const lessons = await prisma.lesson.findMany({
            where: where as any,
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
                subjects: true
            } as any
        })

        if (!student) {
            return NextResponse.json(
                { error: 'Ученик не найден' },
                { status: 404 }
            )
        }

        // DRY: Handle recurring lessons
        if (validatedData.recurrence?.enabled) {
            return await createRecurringLesson(payload.userId, validatedData)
        }

        // DRY: Handle single lesson
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
            { error: 'Произошла ошибка при создании занятия' },
            { status: 500 }
        )
    }
}
async function createSingleLesson(userId: string, data: z.infer<typeof lessonSchema>) {
    const lesson = await prisma.lesson.create({
        data: {
            date: data.date,
            price: data.price,
            isPaid: data.isPaid || false,
            isCanceled: data.isCanceled || false,
            isTrial: data.isTrial || false,
            notes: data.notes,
            topic: data.topic,
            ownerId: userId,
            studentId: data.studentId,
            subjectId: data.subjectId,
        },
        include: {
            student: true,
            subject: true,
        },
    })

    // Fetch student for slug generation
    const student = await prisma.student.findUnique({
        where: { id: lesson.studentId }
    })

    // Generate and update slug
    const slug = generateLessonSlug(student!.name, new Date(lesson.date), lesson.topic || undefined)
    const updatedLesson = await prisma.lesson.update({
        where: { id: lesson.id },
        data: { slug },
        include: {
            student: true,
            subject: true,
        },
    })

    // Link subject to student if needed
    if (data.subjectId) {
        await linkSubjectToStudent(data.studentId, data.subjectId)
    }

    return NextResponse.json(updatedLesson, { status: 201 })
}

async function createRecurringLesson(userId: string, data: z.infer<typeof lessonSchema>) {
    const recurrence = data.recurrence!

    // Validate recurrence rule
    const validation = validateRecurrenceRule(recurrence)
    if (!validation.valid) {
        return NextResponse.json(
            { error: validation.error },
            { status: 400 }
        )
    }

    // Create lesson series
    const series = await (prisma as any).lessonSeries.create({
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
            notes: data.notes,
        },
    })

    // Generate dates for next 3 months (or until end date)
    const threeMonthsFromNow = new Date()
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3)

    const dates = generateRecurringDates({
        startDate: data.date,
        rule: recurrence,
        limit: 100,
        endDate: threeMonthsFromNow,
    })

    // Create lessons for generated dates
    const lessons = await prisma.lesson.createMany({
        data: dates.map((date, index) => ({
            date,
            // Use seriesPrice for subsequent lessons if provided, otherwise use standard price
            price: index === 0 ? data.price : (data.seriesPrice !== undefined ? data.seriesPrice : data.price),

            isPaid: data.isPaidAll ? true : (index === 0 ? (data.isPaid || false) : false),
            isCanceled: false,
            notes: data.notes,
            topic: data.topic,
            ownerId: userId,
            studentId: data.studentId,
            subjectId: data.subjectId,
            seriesId: series.id,
        })),
    })

    // Link subject to student if needed
    if (data.subjectId) {
        await linkSubjectToStudent(data.studentId, data.subjectId)
    }

    // Return first lesson with series info
    const firstLesson = await prisma.lesson.findFirst({
        where: { seriesId: series.id } as any,
        include: {
            student: true,
            subject: true,
            // series: true, // TODO: Uncomment after TS server restart
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
            } as any,
        })
    } catch (error) {
        console.log('Subject linking attempt result:', error)
    }
}
