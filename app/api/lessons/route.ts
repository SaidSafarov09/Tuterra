import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/jwt'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { generateRecurringDates, validateRecurrenceRule } from '@/lib/recurring-lessons'
import type { RecurrenceRule } from '@/types/recurring'
import { generateLessonSlug } from '@/lib/slugUtils'
import { checkLessonOverlap, checkRecurringConflicts, formatConflictMessage } from '@/lib/lessonValidation'
import { sendTelegramNotification } from '@/lib/telegram'

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
    paidStudentIds: z.array(z.string()).optional(),
    planTopicId: z.string().optional().nullable().transform(val => val === '' ? null : val),
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
        let where: any = { ownerId: payload.userId }

        if (filter === 'upcoming') {
            where.isCanceled = false
            // Для upcoming нужно получить занятия, которые еще не закончились
            // Это включает и те, которые уже начались (ongoing)
            // Используем широкий диапазон: получаем занятия за последние 24 часа и будущие
            // чтобы покрыть все возможные ongoing занятия (даже очень длинные)
            const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
            where.date = { gte: oneDayAgo }
        } else if (filter === 'past') {
            where.isCanceled = false
            // Для past можно предварительно отфильтровать по дате начала
            // Но все равно нужно проверить с учетом длительности
            where.date = { lt: now }
        } else if (filter === 'unpaid') {
            // For groups, "unpaid" is tricky. Maybe if not everyone paid?
            // Or we just rely on isPaid flag for now, or check payments.
            // User said: "Sum of lesson in list is total... sum of payments from all checked."
            // If we want to filter unpaid, maybe we skip groups for now or check if sum < expected?
            // Let's keep simple logic for now.
            where.isPaid = false
            where.isCanceled = false
            where.price = { gt: 0 }
        } else if (filter === 'canceled') {
            where.isCanceled = true
        }

        let lessons = await prisma.lesson.findMany({
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
            },
            orderBy: { date: filter === 'past' ? 'desc' : 'asc' },
        })

        // Фильтруем занятия с учетом длительности для фильтров 'upcoming' и 'past'
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
                    const totalStudents = lesson.group.students?.length || 0
                    // If everyone paid, it is NOT unpaid. Filter it out.
                    if (totalStudents > 0 && paidCount >= totalStudents) {
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
            lessonPayments: data.groupId ? {
                create: groupStudents.map(student => ({
                    studentId: student.id,
                    hasPaid: data.paidStudentIds?.includes(student.id) || false
                }))
            } : undefined
        } as any,
        include: {
            student: true,
            group: true,
            subject: true,
            lessonPayments: true,
        },
    })

    if (data.subjectId && data.studentId) {
        await linkSubjectToStudent(data.studentId, data.subjectId)
    }

    // Send Telegram Notification
    const user = await prisma.user.findUnique({ where: { id: userId } })
    const timeStr = new Intl.DateTimeFormat('ru-RU', {
        day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
        timeZone: user?.timezone || 'Europe/Moscow'
    }).format(new Date(lesson.date))

    const entityNameNotify = lesson.group?.name || lesson.student?.name || 'Ученик'
    const sName = lesson.subject?.name || 'Без предмета'
    const entityLabel = lesson.groupId ? 'группой' : 'учеником'
    const notifyMsg = `🆕 **Новое занятие:**\n\nЗанятие по предмету **${sName}** с ${entityLabel} **${entityNameNotify}** добавлено в расписание на **${timeStr}**.`

    const settings = await prisma.notificationSettings.findUnique({ where: { userId } })
    if (settings?.statusChanges) {
        if (settings.deliveryWeb) {
            await prisma.notification.create({
                data: {
                    userId,
                    title: 'Новое занятие',
                    message: `Занятие по предмету ${sName} с ${entityLabel} ${entityNameNotify} добавлено на ${timeStr}`,
                    type: 'lesson_created',
                    isRead: false
                }
            })
        }
        await sendTelegramNotification(userId, notifyMsg, 'statusChanges')
    }

    return NextResponse.json(lesson, { status: 201 })
}

async function createRecurringLesson(userId: string, data: z.infer<typeof lessonSchema>) {
    const recurrence = data.recurrence!
    const validation = validateRecurrenceRule(recurrence)
    if (!validation.valid) {
        return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const threeMonthsFromNow = new Date()
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3)

    const dates = generateRecurringDates({
        startDate: data.date,
        rule: recurrence,
        limit: 100,
        endDate: threeMonthsFromNow,
    })

    const [conflict, group] = await Promise.all([
        checkRecurringConflicts(userId, dates, data.duration),
        data.groupId ? prisma.group.findUnique({
            where: { id: data.groupId },
            include: { students: { select: { id: true } } }
        }) : Promise.resolve(null)
    ])

    if (conflict) {
        return NextResponse.json(
            { error: formatConflictMessage(conflict, data.studentId) },
            { status: 400 }
        )
    }

    const groupName = group?.name || null
    const groupStudents = group?.students || []

    const series = await prisma.lessonSeries.create({
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
    }))

    // Batch create lessons
    await prisma.lesson.createMany({ data: lessonsData })

    // If it's a group, we need to batch create lesson payments for ALL students for ALL lessons
    if (data.groupId && groupStudents.length > 0) {
        const createdLessons = await prisma.lesson.findMany({
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
            await prisma.lessonPayment.createMany({ data: paymentsData })
        }
    }

    if (data.subjectId && data.studentId) {
        await linkSubjectToStudent(data.studentId, data.subjectId)
    }

    const firstLesson = await prisma.lesson.findFirst({
        where: { seriesId: series.id },
        include: {
            student: true,
            group: true,
            subject: true,
            lessonPayments: true,
        },
        orderBy: { date: 'asc' },
    })

    // Send Telegram Notification for recurring series
    if (firstLesson) {
        const user = await prisma.user.findUnique({ where: { id: userId } })
        const timeStr = new Intl.DateTimeFormat('ru-RU', {
            day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
            timeZone: user?.timezone || 'Europe/Moscow'
        }).format(new Date(firstLesson.date))

        const entityNameNotify = firstLesson.group?.name || firstLesson.student?.name || 'Ученик'
        const notifyMsg = `🔁 **Новая серия занятий:**\n📅 Первый урок: ${timeStr}\n👤 ${entityNameNotify}\n📚 ${firstLesson.subject?.name || 'Без предмета'}\n🔢 Всего: ${dates.length} уроков`
        await sendTelegramNotification(userId, notifyMsg, 'statusChanges')
    }

    return NextResponse.json({
        ...firstLesson,
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
