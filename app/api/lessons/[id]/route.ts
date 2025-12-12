import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { isCuid } from '@/lib/slugUtils'

const lessonSchema = z.object({
    studentId: z.string().optional(),
    groupId: z.string().optional(),
    date: z.string().transform((str) => new Date(str)),
    price: z.number().nonnegative('Цена должна быть положительной'),
    isPaid: z.boolean(),
    isCanceled: z.boolean().optional(),
    notes: z.string().optional(),
    topic: z.string().optional(),
    duration: z.number().int().positive().optional(),
    paidStudentIds: z.array(z.string()).optional(),
    attendedStudentIds: z.array(z.string()).optional(), // Добавляем валидацию для списка присутствовавших студентов
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
        const whereClause = isId
            ? { id: id, ownerId: user.id }
            : { slug: id, ownerId: user.id }

        const lesson = await prisma.lesson.findFirst({
            where: whereClause,
            include: {
                student: true,
                subject: true,
                group: {
                    include: {
                        students: true
                    }
                },
                lessonPayments: {
                    include: {
                        student: true // Добавляем информацию о студенте для отображения
                    }
                },
            },
        })

        if (!lesson) {
            return NextResponse.json({ error: 'Занятие не найдено' }, { status: 404 })
        }


        if (isId && lesson.slug) {
            return NextResponse.redirect(
                new URL(`/lessons/${lesson.slug}`, request.url),
                { status: 301 }
            )
        }

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

        if (!user) {
            return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
        }

        const body = await request.json()

        // Resolve ID if slug
        let lessonId = id
        if (!isCuid(id)) {
            const found = await prisma.lesson.findFirst({
                where: { slug: id, ownerId: user.id },
                select: { id: true }
            })
            if (!found) return NextResponse.json({ error: 'Занятие не найдено' }, { status: 404 })
            lessonId = found.id
        }

        const validatedData = lessonSchema.parse(body)

        // Validate student or group existence if provided
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

        // Check for lesson overlap - always check since we're updating
        const { checkLessonOverlap, formatConflictMessage } = await import('@/lib/lessonValidation')
        const duration = validatedData.duration || 60
        const conflict = await checkLessonOverlap(
            user.id,
            validatedData.date,
            duration,
            lessonId // Exclude current lesson from check
        )

        if (conflict) {
            return NextResponse.json(
                { error: formatConflictMessage(conflict, validatedData.studentId) },
                { status: 400 }
            )
        }

        const { paidStudentIds, attendedStudentIds, ...lessonData } = validatedData

        // Update lesson
        const lesson = await prisma.lesson.updateMany({
            where: {
                id: lessonId,
                ownerId: user.id,
            },
            data: lessonData as any,
        })

        if (lesson.count === 0) {
            return NextResponse.json({ error: 'Занятие не найдено' }, { status: 404 })
        }

        // Update payments if provided
        if (paidStudentIds !== undefined || attendedStudentIds !== undefined) {
            await prisma.lessonPayment.deleteMany({
                where: { lessonId: lessonId }
            })
            
            if (paidStudentIds && paidStudentIds.length > 0) {
                // Создаем записи для оплативших студентов
                await prisma.lessonPayment.createMany({
                    data: paidStudentIds.map(studentId => ({
                        lessonId: lessonId,
                        studentId,
                        hasPaid: true
                    }))
                })
            }
            
            if (attendedStudentIds) {
                // Находим студентов, которые присутствовали, но не оплатили
                const nonPaidAttendedStudentIds = paidStudentIds
                    ? attendedStudentIds.filter(id => !paidStudentIds.includes(id))
                    : attendedStudentIds;
                
                if (nonPaidAttendedStudentIds.length > 0) {
                    // Создаем записи для присутствовавших, но не оплативших студентов
                    await prisma.lessonPayment.createMany({
                        data: nonPaidAttendedStudentIds.map(studentId => ({
                            lessonId: lessonId,
                            studentId,
                            hasPaid: false
                        }))
                    })
                }
            }
            
            // Обновляем статус оплаты занятия на основе данных о посещаемости и оплате
            const lessonWithGroup = await prisma.lesson.findUnique({
                where: { id: lessonId },
                include: {
                    group: {
                        include: {
                            students: true
                        }
                    },
                    lessonPayments: true
                }
            })
            
            if (lessonWithGroup?.group && lessonWithGroup.lessonPayments) {
                // Получаем только присутствовавших студентов (те, у кого есть запись в lessonPayments)
                const attendedPayments = lessonWithGroup.lessonPayments
                const attendedStudentsCount = attendedPayments.length
                const paidAttendedCount = attendedPayments.filter(p => p.hasPaid).length
                
                // Определяем статус оплаты занятия
                let isLessonPaid = false
                if (attendedStudentsCount > 0 && paidAttendedCount === attendedStudentsCount) {
                    isLessonPaid = true // Все присутствовавшие оплатили
                } else if (attendedStudentsCount > 0 && paidAttendedCount > 0 && paidAttendedCount < attendedStudentsCount) {
                    isLessonPaid = true // Частично оплачено (некоторые присутствовавшие оплатили)
                }
                
                // Обновляем статус оплаты занятия
                await prisma.lesson.update({
                    where: { id: lessonId },
                    data: { isPaid: isLessonPaid }
                })
            }
        }

        const updatedLesson = await prisma.lesson.findUnique({
            where: { id: lessonId },
            include: {
                student: true,
                group: {
                    include: {
                        students: true
                    }
                },
                subject: true,
                lessonPayments: {
                    include: {
                        student: true
                    }
                },
            },
        })

        return NextResponse.json(updatedLesson)
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: error.errors[0].message },
                { status: 400 }
            )
        }

        console.error('Update lesson error:', error)
        return NextResponse.json(
            { error: 'Произошла ошибка при обновлении занятия' },
            { status: 500 }
        )
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const user = await getCurrentUser(request)

        if (!user) {
            return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
        }

        const body = await request.json()

        // Resolve ID if slug
        let lessonId = id
        if (!isCuid(id)) {
            const found = await prisma.lesson.findFirst({
                where: { slug: id, ownerId: user.id },
                select: { id: true }
            })
            if (!found) return NextResponse.json({ error: 'Занятие не найдено' }, { status: 404 })
            lessonId = found.id
        }

        const updateData: any = {}

        // Basic fields
        if (body.isPaid !== undefined) updateData.isPaid = body.isPaid
        if (body.price !== undefined) updateData.price = body.price
        if (body.date !== undefined) updateData.date = new Date(body.date)
        if (body.studentId !== undefined) updateData.studentId = body.studentId
        if (body.groupId !== undefined) updateData.groupId = body.groupId
        if (body.subjectId !== undefined) updateData.subjectId = body.subjectId
        if (body.isCanceled !== undefined) updateData.isCanceled = body.isCanceled
        if (body.notes !== undefined) updateData.notes = body.notes
        if (body.topic !== undefined) updateData.topic = body.topic
        if (body.duration !== undefined) updateData.duration = body.duration

        // Check for lesson overlap when date or duration changes
        if (body.date !== undefined || body.duration !== undefined) {
            // Get current lesson to check duration if not provided
            const currentLesson = await prisma.lesson.findFirst({
                where: { id: lessonId, ownerId: user.id }
            })

            if (!currentLesson) {
                return NextResponse.json({ error: 'Занятие не найдено' }, { status: 404 })
            }

            const { checkLessonOverlap, formatConflictMessage } = await import('@/lib/lessonValidation')
            const checkDate = body.date ? new Date(body.date) : new Date(currentLesson.date)
            const checkDuration = body.duration !== undefined ? body.duration : currentLesson.duration

            const conflict = await checkLessonOverlap(
                user.id,
                checkDate,
                checkDuration,
                lessonId // Exclude current lesson from check
            )

            if (conflict) {
                return NextResponse.json(
                    { error: formatConflictMessage(conflict, body.studentId || currentLesson.studentId) },
                    { status: 400 }
                )
            }
        }

        // Update lesson fields only if there are any
        if (Object.keys(updateData).length > 0) {
            const lesson = await prisma.lesson.updateMany({
                where: {
                    id: lessonId,
                    ownerId: user.id,
                },
                data: updateData,
            })

            if (lesson.count === 0) {
                return NextResponse.json({ error: 'Занятие не найдено' }, { status: 404 })
            }
        } else {
            // If no fields to update, just verify lesson exists
            const lessonExists = await prisma.lesson.findFirst({
                where: { id: lessonId, ownerId: user.id }
            })

            if (!lessonExists) {
                return NextResponse.json({ error: 'Занятие не найдено' }, { status: 404 })
            }
        }

        // Update payments if provided
        if (body.paidStudentIds !== undefined || body.attendedStudentIds !== undefined) {
            await prisma.lessonPayment.deleteMany({
                where: { lessonId: lessonId }
            })

            if (body.paidStudentIds && body.paidStudentIds.length > 0) {
                // Создаем записи для оплативших студентов
                await prisma.lessonPayment.createMany({
                    data: body.paidStudentIds.map((studentId: string) => ({
                        lessonId: lessonId,
                        studentId,
                        hasPaid: true
                    }))
                })
            }
            
            if (body.attendedStudentIds) {
                // Находим студентов, которые присутствовали, но не оплатили
                const nonPaidAttendedStudentIds = body.paidStudentIds
                    ? body.attendedStudentIds.filter((id: string) => !body.paidStudentIds.includes(id))
                    : body.attendedStudentIds;
                
                if (nonPaidAttendedStudentIds.length > 0) {
                    // Создаем записи для присутствовавших, но не оплативших студентов
                    await prisma.lessonPayment.createMany({
                        data: nonPaidAttendedStudentIds.map((studentId: string) => ({
                            lessonId: lessonId,
                            studentId,
                            hasPaid: false
                        }))
                    })
                }
            }
            
            // Обновляем статус оплаты занятия на основе данных о посещаемости и оплате
            const lessonWithGroup = await prisma.lesson.findUnique({
                where: { id: lessonId },
                include: {
                    group: {
                        include: {
                            students: true
                        }
                    },
                    lessonPayments: true
                }
            })
            
            if (lessonWithGroup?.group && lessonWithGroup.lessonPayments) {
                // Получаем только присутствовавших студентов (те, у кого есть запись в lessonPayments)
                const attendedPayments = lessonWithGroup.lessonPayments
                const attendedStudentsCount = attendedPayments.length
                const paidAttendedCount = attendedPayments.filter(p => p.hasPaid).length
                
                // Определяем статус оплаты занятия
                let isLessonPaid = false
                if (attendedStudentsCount > 0 && paidAttendedCount === attendedStudentsCount) {
                    isLessonPaid = true // Все присутствовавшие оплатили
                } else if (attendedStudentsCount > 0 && paidAttendedCount > 0 && paidAttendedCount < attendedStudentsCount) {
                    isLessonPaid = true // Частично оплачено (некоторые присутствовавшие оплатили)
                }
                
                // Обновляем статус оплаты занятия
                await prisma.lesson.update({
                    where: { id: lessonId },
                    data: { isPaid: isLessonPaid }
                })
            }
        }

        const updatedLesson = await prisma.lesson.findUnique({
            where: { id: lessonId },
            include: {
                student: true,
                group: {
                    include: {
                        students: true
                    }
                },
                subject: true,
                lessonPayments: {
                    include: {
                        student: true
                    }
                },
            },
        })

        return NextResponse.json(updatedLesson)
    } catch (error) {
        console.error('Patch lesson error:', error)
        return NextResponse.json(
            { error: 'Произошла ошибка при обновлении занятия' },
            { status: 500 }
        )
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

        const isId = isCuid(id)
        const whereClause = isId
            ? { id: id, ownerId: user.id }
            : { slug: id, ownerId: user.id }

        const lesson = await prisma.lesson.findFirst({
            where: whereClause,
        })

        if (!lesson) {
            return NextResponse.json({ error: 'Занятие не найдено' }, { status: 404 })
        }

        const lessonWithSeries = lesson as any

        if (scope === 'series' && lessonWithSeries.seriesId) {
            await prisma.lesson.deleteMany({
                where: {
                    seriesId: lessonWithSeries.seriesId,
                    ownerId: user.id,
                } as any,
            })
            await (prisma as any).lessonSeries.delete({
                where: {
                    id: lessonWithSeries.seriesId,
                    userId: user.id,
                },
            })
        } else {
            await prisma.lesson.delete({
                where: {
                    id: lesson.id,
                },
            })
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
