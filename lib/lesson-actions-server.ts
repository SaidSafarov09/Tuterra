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
        const settings = await prisma.notificationSettings.upsert({
            where: { userId },
            create: { userId },
            update: {}
        })
        if (!settings.statusChanges) return

        const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } })
        const isStudent = user?.role === 'student'

        const formatter = new Intl.DateTimeFormat('ru-RU', {
            day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', timeZone: timezone
        })

        const subjectName = lesson.subject?.name || 'Занятие'
        const entityName = lesson.student?.name || lesson.group?.name || 'Ученик'
        const entityLabel = lesson.groupId ? 'группой' : 'учеником'
        const actorName = lesson.owner?.firstName || lesson.owner?.name || 'Преподаватель'

        const msg = isStudent
            ? `📅 <b>Занятие перенесено:</b>\n\nПреподаватель <b>${actorName}</b> перенес занятие по предмету <b>${subjectName}</b>.\n⏳ Было: ${formatter.format(oldDate)}\n🚀 Стало: <b>${formatter.format(newDate)}</b>`
            : `📅 <b>Занятие перенесено:</b>\n\nЗанятие по предмету <b>${subjectName}</b> с ${entityLabel} <b>${entityName}</b> перенесено\n⏳ Было: ${formatter.format(oldDate)}\n🚀 Стало: <b>${formatter.format(newDate)}</b>`

        if (settings.deliveryWeb) {
            const title = 'Занятие перенесено'
            const message = isStudent
                ? `Преподаватель ${actorName} перенес занятие (${subjectName}) с ${formatter.format(oldDate)} на ${formatter.format(newDate)}`
                : `Занятие по предмету ${subjectName} с ${entityLabel} ${entityName} перенесено с ${formatter.format(oldDate)} на ${formatter.format(newDate)}`

            const link = isStudent ? `/student/lessons/${lesson.id}` : `/lessons/${lesson.id}`

            await prisma.notification.create({
                data: {
                    userId,
                    title,
                    message,
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

/**
 * Notify teacher about new student request with interactive buttons
 */
export async function notifyNewLessonRequest(requestId: string) {
    try {
        const lr = await (prisma as any).lessonRequest.findUnique({
            where: { id: requestId },
            include: {
                lesson: { include: { subject: true, student: true, group: true } },
                user: true // The student
            }
        })

        if (!lr) return

        const teacherId = lr.lesson.ownerId
        const teacher = await prisma.user.findUnique({
            where: { id: teacherId },
            include: { notificationSettings: true }
        })

        if (!teacher) return

        const timezone = teacher.timezone || 'Europe/Moscow'
        const formatter = new Intl.DateTimeFormat('ru-RU', {
            day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', timeZone: timezone
        })

        const subjectName = lr.lesson.subject?.name || 'Занятие'
        const studentName = lr.user.firstName || lr.user.name || 'Ученик'
        const typeLabel = lr.type === 'cancel' ? '❌ ОТМЕНУ' : '🕒 ПЕРЕНОС'

        let msg = `📩 <b>Новая заявка от ученика!</b>\n\nУченик <b>${studentName}</b> запрашивает ${typeLabel} занятия.\n\n📚 Предмет: ${subjectName}\n📅 Урок: ${formatter.format(lr.lesson.date)}`

        if (lr.type === 'reschedule' && lr.newDate) {
            msg += `\n🚀 Новая дата: <b>${formatter.format(lr.newDate)}</b>`
        }

        if (lr.reason) {
            msg += `\n\n💬 Причина: <i>${lr.reason}</i>`
        }

        const buttons = [
            [
                { text: '✅ Одобрить', callback_data: `lr_approve:${requestId}` },
                { text: '❌ Отклонить', callback_data: `lr_reject:${requestId}` }
            ]
        ]

        // 1. Web Notification
        if (teacher.notificationSettings?.deliveryWeb) {
            await prisma.notification.create({
                data: {
                    userId: teacherId,
                    title: 'Новая заявка от ученика',
                    message: `${studentName} просит ${lr.type === 'cancel' ? 'отменить' : 'перенести'} занятие (${subjectName})`,
                    type: 'lesson_request',
                    link: '/dashboard', // Can be refined
                    isRead: false
                }
            })
        }

        // 2. Telegram Notification
        await sendTelegramNotification(teacherId, msg, 'statusChanges', buttons)

    } catch (error) {
        console.error('Failed to notify about new lesson request:', error)
    }
}

/**
 * Notify student about request status change
 */
export async function notifyLessonRequestResult(requestId: string) {
    try {
        const lr = await (prisma as any).lessonRequest.findUnique({
            where: { id: requestId },
            include: {
                lesson: { include: { subject: true, owner: true } },
                user: true // The student
            }
        })

        if (!lr) return

        const studentUserId = lr.userId
        const teacherName = lr.lesson.owner.firstName || lr.lesson.owner.name || 'Преподаватель'
        const subjectName = lr.lesson.subject?.name || 'Занятие'
        const statusLabel = lr.status === 'approved' ? '✅ ОДОБРЕНА' : '❌ ОТКЛОНЕНА'

        const msg = `🔔 <b>Статус вашей заявки изменен</b>\n\nПреподаватель <b>${teacherName}</b> рассмотрел вашу заявку на ${lr.type === 'cancel' ? 'отмену' : 'перенос'} занятия по предмету <b>${subjectName}</b>.\n\nРезультат: <b>${statusLabel}</b>`

        // Web notification
        await prisma.notification.create({
            data: {
                userId: studentUserId,
                title: 'Ответ на вашу заявку',
                message: `Ваша заявка на ${lr.type === 'cancel' ? 'отмену' : 'перенос'} занятия (${subjectName}) была ${lr.status === 'approved' ? 'одобрена' : 'отклонена'}`,
                type: 'lesson_request_result',
                link: '/student/lessons',
                isRead: false
            }
        })

        // Telegram notification
        await sendTelegramNotification(studentUserId, msg, 'statusChanges')

    } catch (error) {
        console.error('Failed to notify about lesson request result:', error)
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

    if (finalAttendedIds.length === 0 && currentLesson.studentId && !currentLesson.groupId) {
        finalAttendedIds.push(currentLesson.studentId)
    }

    const isPast = new Date(currentLesson.date) < new Date()

    if (finalAttendedIds.length === 0 && !isPast) {
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

        const lessonWithGroup = await prisma.lesson.findUnique({
            where: { id: lessonId },
            include: { group: true, lessonPayments: true }
        })

        if (lessonWithGroup?.group) {
            const payments = lessonWithGroup.lessonPayments || []
            const status = payments.length > 0 ? getGroupLessonPaymentStatus(payments) : 'unpaid'
            await prisma.lesson.update({
                where: { id: lessonId },
                data: { isPaid: status === 'paid', isCanceled: false }
            })
        } else if (!lessonWithGroup?.group) {
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
        const settings = await prisma.notificationSettings.upsert({
            where: { userId },
            create: { userId },
            update: {}
        })
        const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } })
        const isStudent = user?.role === 'student'

        const formatter = new Intl.DateTimeFormat('ru-RU', {
            day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
            timeZone: timezone
        })
        const timeStr = formatter.format(new Date(lesson.date))
        const entityName = lesson.group?.name || lesson.student?.name || 'Ученик'
        const subjectName = lesson.subject?.name || 'Без предмета'
        const entityLabel = lesson.groupId ? 'группой' : 'учеником'
        const actorName = lesson.owner?.firstName || lesson.owner?.name || 'Преподаватель'

        let msg = ''
        if (isRecurring) {
            msg = isStudent
                ? `🔁 <b>Новая серия занятий:</b>\n\nПреподаватель <b>${actorName}</b> добавил новые занятия по предмету <b>${subjectName}</b>.\n📅 Первый урок: ${timeStr}\n🔢 Всего: ${totalCount} уроков`
                : `🔁 <b>Новая серия занятий:</b>\n📅 Первый урок: ${timeStr}\n👤 ${entityName}\n📚 ${subjectName}\n🔢 Всего: ${totalCount} уроков`
        } else {
            msg = isStudent
                ? `🆕 <b>Новое занятие:</b>\n\nПреподаватель <b>${actorName}</b> добавил занятие по предмету <b>${subjectName}</b> в расписание на <b>${timeStr}</b>.`
                : `🆕 <b>Новое занятие:</b>\n\nЗанятие по предмету <b>${subjectName}</b> с ${entityLabel} <b>${entityName}</b> добавлено в расписание на <b>${timeStr}</b>.`
        }

        if (settings?.statusChanges) {
            if (settings.deliveryWeb) {
                const link = isStudent ? `/student/lessons/${lesson.id}` : `/lessons/${lesson.id}`
                const title = isRecurring ? 'Новая серия занятий' : 'Новое занятие'
                const message = isStudent
                    ? (isRecurring ? `Преподаватель ${actorName} добавил серию занятий (${subjectName})` : `Преподаватель ${actorName} добавил занятие (${subjectName}) на ${timeStr}`)
                    : (isRecurring ? `Серия из ${totalCount} занятий по предмету ${subjectName} с ${entityName} добавлена` : `Занятие по предмету ${subjectName} с ${entityLabel} ${entityName} добавлено на ${timeStr}`)

                await prisma.notification.create({
                    data: {
                        userId,
                        title,
                        message,
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

export async function notifyLessonDeleted(
    userId: string,
    lesson: any,
    isSeries: boolean = false
) {
    try {
        const settings = await prisma.notificationSettings.upsert({
            where: { userId },
            create: { userId },
            update: {}
        })

        const subjectName = lesson.subject?.name || 'Занятие'
        const entityName = lesson.student?.name || lesson.group?.name || '---'
        const entityLabel = lesson.groupId ? 'группой' : 'учеником'
        const actorName = lesson.owner?.firstName || lesson.owner?.name || 'Преподаватель'

        const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } })
        const isStudent = user?.role === 'student'

        const labelPrefix = isSeries ? 'Серия занятий' : 'Занятие'

        const msg = isStudent
            ? `🗑 <b>${labelPrefix} удалена:</b>\n\nПреподаватель <b>${actorName}</b> удалил ${isSeries ? 'все будущие занятия' : 'занятие'} по предмету <b>${subjectName}</b>.`
            : `🗑 <b>${labelPrefix} удалена:</b>\n\n${labelPrefix} по предмету <b>${subjectName}</b> с ${entityLabel} <b>${entityName}</b> была удалена.`

        if (settings.statusChanges) {
            if (settings.deliveryWeb) {
                await prisma.notification.create({
                    data: {
                        userId,
                        title: isSeries ? 'Серия занятий удалена' : 'Занятие удалено',
                        message: isStudent
                            ? `Преподаватель ${actorName} удалил ${isSeries ? 'серию занятий' : 'занятие'} (${subjectName})`
                            : `${labelPrefix} по предмету ${subjectName} с ${entityLabel} ${entityName} была удалена`,
                        type: 'lesson_deleted',
                        link: isStudent ? '/student/lessons' : '/lessons',
                        isRead: false
                    }
                })
            }
            await sendTelegramNotification(userId, msg, 'statusChanges')
        }
    } catch (error) {
        console.error('Failed to send deletion notification:', error)
    }
}

export async function notifyLessonStatusChanged(
    userId: string,
    lesson: any,
    status: 'canceled' | 'restored',
    timezone: string = 'Europe/Moscow'
) {
    try {
        const settings = await prisma.notificationSettings.upsert({
            where: { userId },
            create: { userId },
            update: {}
        })
        if (!settings.statusChanges) return

        const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } })
        const isStudent = user?.role === 'student'

        const formatter = new Intl.DateTimeFormat('ru-RU', {
            day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', timeZone: timezone
        })

        const subjectName = lesson.subject?.name || 'Занятие'
        const entityName = lesson.student?.name || lesson.group?.name || 'Ученик'
        const actorName = lesson.owner?.firstName || lesson.owner?.name || 'Преподаватель'
        const timeStr = formatter.format(new Date(lesson.date))

        const title = status === 'canceled' ? 'Занятие отменено' : 'Занятие восстановлено'
        const emoji = status === 'canceled' ? '❌' : '✅'

        const msg = isStudent
            ? `${emoji} <b>${title}:</b>\n\nПреподаватель <b>${actorName}</b> ${status === 'canceled' ? 'отменил' : 'восстановил'} занятие по предмету <b>${subjectName}</b> (${timeStr}).`
            : `${emoji} <b>${title}:</b>\n\nЗанятие по предмету <b>${subjectName}</b> с <b>${entityName}</b> (${timeStr}) было ${status === 'canceled' ? 'отменено' : 'восстановлено'}.`

        if (settings.deliveryWeb) {
            const link = isStudent ? `/student/lessons/${lesson.id}` : `/lessons/${lesson.id}`
            const message = isStudent
                ? `Преподаватель ${actorName} ${status === 'canceled' ? 'отменил' : 'восстановил'} занятие (${subjectName}) на ${timeStr}`
                : `Занятие по предмету ${subjectName} с ${entityName} на ${timeStr} было ${status === 'canceled' ? 'отменено' : 'восстановлено'}`

            await prisma.notification.create({
                data: {
                    userId,
                    title,
                    message,
                    type: 'lesson_status_changed',
                    link,
                    isRead: false
                }
            })
        }
        await sendTelegramNotification(userId, msg, 'statusChanges')
    } catch (error) {
        console.error('Failed to send status change notification:', error)
    }
}
