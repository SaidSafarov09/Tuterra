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
        // Update payments if provided
        if (paidStudentIds !== undefined || attendedStudentIds !== undefined) {
            let finalAttendedStudentIds = attendedStudentIds

            // Если список присутствующих не передан, получаем текущий список из БД
            if (finalAttendedStudentIds === undefined) {
                const currentPayments = await prisma.lessonPayment.findMany({
                    where: { lessonId: lessonId },
                    select: { studentId: true }
                })
                finalAttendedStudentIds = currentPayments.map(p => p.studentId)
            }

            const finalPaidStudentIds = paidStudentIds || []

            // Если занятие индивидуальное и список студентов пуст, 
            // но есть studentId в самом занятии, добавляем его
            if (finalAttendedStudentIds.length === 0 && validatedData.studentId) {
                finalAttendedStudentIds.push(validatedData.studentId)
            } else if (finalAttendedStudentIds.length === 0 && !validatedData.groupId && !validatedData.studentId) {
                // Если это не группа и не индивидуальное занятие (возможно ли это?), 
                // то попробуем найти studentId в текущем занятии, если мы его не обновляли
                const currentLesson = await prisma.lesson.findUnique({
                    where: { id: lessonId },
                    select: { studentId: true }
                })
                if (currentLesson?.studentId) {
                    finalAttendedStudentIds.push(currentLesson.studentId)
                }
            }

            // Если список всё ещё пуст, проверяем, не пытаемся ли мы просто обновить статус оплаты
            // для существующего урока. Если это индивидуальный урок, attendance может и не быть в payments явно?
            // (Зависит от того, как мы создаем payments для индивидуальных уроков. 
            // Обычно payments создаются только когда есть "факт" урока.
            // Но в логике выше: if (finalAttendedStudentIds.length === 0) -> cancel.

            // ПРОБЛЕМА: Для индивидуальных занятий мы можем вообще не использовать LessonPayment для трекинга посещения,
            // если только это не "группа из 1 человека".
            // Но код ниже ПЫТАЕТСЯ создать LessonPayment для всех в finalAttendedStudentIds.

            // Если это ГРУППОВОЙ урок, то finalAttendedStudentIds должен быть заполнен.
            // Если ИНДИВИДУАЛЬНЫЙ, то validatedData.studentId должен быть.

            // Если никто не пришел (и это явно пустой список), отменяем урок
            if (finalAttendedStudentIds.length === 0) {
                await prisma.lessonPayment.deleteMany({
                    where: { lessonId: lessonId }
                })

                await prisma.lesson.update({
                    where: { id: lessonId },
                    data: {
                        isCanceled: true,
                        isPaid: false
                    }
                })
            } else {
                // Удаляем все существующие записи о платежах
                await prisma.lessonPayment.deleteMany({
                    where: { lessonId: lessonId }
                })

                // Создаем записи для всех присутствовавших студентов
                if (finalAttendedStudentIds.length > 0) {
                    await prisma.lessonPayment.createMany({
                        data: finalAttendedStudentIds.map(studentId => ({
                            lessonId: lessonId,
                            studentId,
                            hasPaid: finalPaidStudentIds.includes(studentId)
                        }))
                    })
                }

                // Обновляем статус оплаты занятия на основе данных о посещаемости и оплате
                const { getGroupLessonPaymentStatus } = await import('@/lib/lessonUtils')
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
                    const paymentStatus = getGroupLessonPaymentStatus(lessonWithGroup.lessonPayments)
                    // Теперь считаем урок оплаченным, только если он полностью оплачен ('paid')
                    // 'partial' (частично) будет считаться неоплаченным (isPaid = false), чтобы попадать в списки должников
                    const isLessonPaid = paymentStatus === 'paid'

                    // Обновляем статус оплаты занятия
                    await prisma.lesson.update({
                        where: { id: lessonId },
                        data: {
                            isPaid: isLessonPaid,
                            isCanceled: false // Восстанавливаем урок, если кто-то пришел
                        }
                    })
                }
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
        // Update payments if provided
        if (body.paidStudentIds !== undefined || body.attendedStudentIds !== undefined) {
            let finalAttendedStudentIds = body.attendedStudentIds

            // Если список присутствующих не передан, получаем текущий список из БД
            if (finalAttendedStudentIds === undefined) {
                const currentPayments = await prisma.lessonPayment.findMany({
                    where: { lessonId: lessonId },
                    select: { studentId: true }
                })
                finalAttendedStudentIds = currentPayments.map((p: any) => p.studentId)
            }

            const finalPaidStudentIds = body.paidStudentIds || []

            // Для PATCH нам может понадобиться studentId если его нет в attended
            // Но в PATCH мы могли обновлять не все, поэтому studentId может не быть в body.
            // Нужно проверить текущий урок.
            if (finalAttendedStudentIds.length === 0) {
                const currentLesson = await prisma.lesson.findUnique({
                    where: { id: lessonId },
                    select: { studentId: true, groupId: true }
                })

                // Если это индивидуальный урок (есть studentId, нет groupId), считаем студента присутствующим по умолчанию
                if (currentLesson?.studentId && !currentLesson.groupId) {
                    finalAttendedStudentIds.push(currentLesson.studentId)
                }
            }

            // Если никто не пришел, отменяем урок
            if (finalAttendedStudentIds.length === 0) {
                await prisma.lessonPayment.deleteMany({
                    where: { lessonId: lessonId }
                })

                await prisma.lesson.update({
                    where: { id: lessonId },
                    data: {
                        isCanceled: true,
                        isPaid: false
                    }
                })
            } else {
                // Удаляем все существующие записи о платежах
                await prisma.lessonPayment.deleteMany({
                    where: { lessonId: lessonId }
                })

                // Создаем записи для всех присутствовавших студентов
                if (finalAttendedStudentIds.length > 0) {
                    await prisma.lessonPayment.createMany({
                        data: finalAttendedStudentIds.map((studentId: string) => ({
                            lessonId: lessonId,
                            studentId,
                            hasPaid: finalPaidStudentIds.includes(studentId)
                        }))
                    })
                }

                // Обновляем статус оплаты занятия на основе данных о посещаемости и оплате
                const { getGroupLessonPaymentStatus } = await import('@/lib/lessonUtils')
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
                    const paymentStatus = getGroupLessonPaymentStatus(lessonWithGroup.lessonPayments)
                    // Теперь считаем урок оплаченным, только если он полностью оплачен ('paid')
                    // 'partial' (частично) будет считаться неоплаченным (isPaid = false), чтобы попадать в списки должников
                    const isLessonPaid = paymentStatus === 'paid'

                    // Обновляем статус оплаты занятия
                    await prisma.lesson.update({
                        where: { id: lessonId },
                        data: {
                            isPaid: isLessonPaid,
                            isCanceled: false // Восстанавливаем урок, если кто-то пришел
                        }
                    })
                }
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
