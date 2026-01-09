import { prisma } from '@/lib/prisma'
import { sendTelegramNotification } from '@/lib/telegram'
import { getGroupLessonPaymentStatus } from '@/lib/lessonUtils'

export async function notifyLessonRescheduled(
    userId: string,
    oldDate: Date,
    newDate: Date,
    lesson: any,
    timezone: string = 'Europe/Moscow'
) {
    try {
        const settings = await prisma.notificationSettings.findUnique({ where: { userId } })
        if (!settings?.statusChanges) return

        const formatter = new Intl.DateTimeFormat('ru-RU', {
            day: 'numeric',
            month: 'long',
            hour: '2-digit',
            minute: '2-digit',
            timeZone: timezone
        })

        const subjectName = lesson.subject?.name || 'Занятие'
        const studentName = lesson.student?.name || lesson.group?.name || 'Ученик'
        const entityLabel = lesson.groupId ? 'группой' : 'учеником'

        const msg = `📅 **Занятие перенесено:**\n\nЗанятие по предмету **${subjectName}** с ${entityLabel} **${studentName}** перенесено\n⏳ Было: ${formatter.format(oldDate)}\n🚀 Стало: **${formatter.format(newDate)}**`

        if (settings.deliveryWeb) {
            const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } })
            const isStudent = user?.role === 'student'
            const link = isStudent ? `/student/lessons/${lesson.id}` : `/lessons/${lesson.id}`

            await prisma.notification.create({
                data: {
                    userId,
                    title: 'Занятие перенесено',
                    message: `Занятие по предмету ${subjectName} с ${entityLabel} ${studentName} перенесено с ${formatter.format(oldDate)} на ${formatter.format(newDate)}`,
                    type: 'lesson_rescheduled',
                    link,
                    isRead: false
                }
            })
        }
        await sendTelegramNotification(userId, msg, 'statusChanges')
    } catch (error) {
        console.error('Failed to send reschedule notification:', error)
    }
}

export async function updateLessonPayments(
    lessonId: string,
    paidStudentIds: string[] | undefined,
    attendedStudentIds: string[] | undefined,
    currentLesson: any
) {
    let finalAttendedIds = attendedStudentIds

    if (finalAttendedIds === undefined) {
        const currentPayments = await prisma.lessonPayment.findMany({
            where: { lessonId },
            select: { studentId: true }
        })
        finalAttendedIds = currentPayments.map(p => p.studentId)
    }

    const finalPaidIds = paidStudentIds || []

    // Fallback for individual lessons if empty
    if (finalAttendedIds.length === 0 && currentLesson.studentId && !currentLesson.groupId) {
        finalAttendedIds.push(currentLesson.studentId)
    }

    const isPast = new Date(currentLesson.date) < new Date()

    if (finalAttendedIds.length === 0 && !isPast) {
        // Cancel lesson if no one attended AND it's a future lesson
        await prisma.lessonPayment.deleteMany({ where: { lessonId } })
        await prisma.lesson.update({
            where: { id: lessonId },
            data: { isCanceled: true, isPaid: false }
        })
    } else {
        await prisma.lessonPayment.deleteMany({ where: { lessonId } })

        if (finalAttendedIds.length > 0) {
            await prisma.lessonPayment.createMany({
                data: finalAttendedIds.map(studentId => ({
                    lessonId,
                    studentId,
                    hasPaid: finalPaidIds.includes(studentId)
                }))
            })
        }

        // Re-fetch to get updated payments and group info
        const lessonWithGroup = await prisma.lesson.findUnique({
            where: { id: lessonId },
            include: { group: true, lessonPayments: true }
        })

        if (lessonWithGroup?.group) {
            const payments = lessonWithGroup.lessonPayments || []
            const status = payments.length > 0 ? getGroupLessonPaymentStatus(payments) : 'unpaid'
            await prisma.lesson.update({
                where: { id: lessonId },
                data: {
                    isPaid: status === 'paid',
                    isCanceled: false
                }
            })
        } else if (!lessonWithGroup?.group) {
            // Individual lesson: isPaid is just whatever we were told
            const isPaid = finalPaidIds.length > 0 && currentLesson.studentId ? finalPaidIds.includes(currentLesson.studentId) : false
            await prisma.lesson.update({
                where: { id: lessonId },
                data: { isPaid, isCanceled: false }
            })
        }
    }
}

export async function notifyLessonCreated(
    userId: string,
    lesson: any,
    isRecurring: boolean = false,
    totalCount: number = 1,
    timezone: string = 'Europe/Moscow'
) {
    try {
        const settings = await prisma.notificationSettings.findUnique({ where: { userId } })
        const formatter = new Intl.DateTimeFormat('ru-RU', {
            day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
            timeZone: timezone
        })
        const timeStr = formatter.format(new Date(lesson.date))
        const entityName = lesson.group?.name || lesson.student?.name || 'Ученик'
        const subjectName = lesson.subject?.name || 'Без предмета'
        const entityLabel = lesson.groupId ? 'группой' : 'учеником'

        let msg = ''
        if (isRecurring) {
            msg = `🔁 **Новая серия занятий:**\n📅 Первый урок: ${timeStr}\n👤 ${entityName}\n📚 ${subjectName}\n🔢 Всего: ${totalCount} уроков`
        } else {
            msg = `🆕 **Новое занятие:**\n\nЗанятие по предмету **${subjectName}** с ${entityLabel} **${entityName}** добавлено в расписание на **${timeStr}**.`
        }

        if (settings?.statusChanges) {
            if (settings.deliveryWeb) {
                const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } })
                const isStudent = user?.role === 'student'
                const link = isStudent ? `/student/lessons/${lesson.id}` : `/lessons/${lesson.id}`

                await prisma.notification.create({
                    data: {
                        userId,
                        title: isRecurring ? 'Новая серия занятий' : 'Новое занятие',
                        message: isRecurring
                            ? `Серия из ${totalCount} занятий по предмету ${subjectName} с ${entityName} добавлена. Первый урок: ${timeStr}`
                            : `Занятие по предмету ${subjectName} с ${entityLabel} ${entityName} добавлено на ${timeStr}`,
                        type: 'lesson_created',
                        link,
                        isRead: false
                    }
                })
            }
            await sendTelegramNotification(userId, msg, 'statusChanges')
        }
    } catch (error) {
        console.error('Failed to send creation notification:', error)
    }
}
