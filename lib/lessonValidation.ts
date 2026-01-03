import { prisma } from '@/lib/prisma'
import { addMinutes, format, isToday, isTomorrow } from 'date-fns'
import { ru } from 'date-fns/locale'

export async function checkLessonOverlap(
    userId: string,
    date: Date,
    duration: number,
    excludeLessonId?: string
) {
    const startTime = date
    const endTime = addMinutes(date, duration)
    // Ищем уроки в диапазоне +/- 24 часа для покрытия всех возможных конфликтов
    const searchStart = addMinutes(startTime, -24 * 60)
    const searchEnd = addMinutes(endTime, 24 * 60)

    const candidates = await prisma.lesson.findMany({
        where: {
            ownerId: userId,
            isCanceled: false,
            id: excludeLessonId ? { not: excludeLessonId } : undefined,
            date: {
                gte: searchStart,
                lt: searchEnd,
            },
        },
        include: {
            subject: true,
            student: true,
            group: true,
        },
    })

    const conflict = candidates.find((lesson) => {
        // Принудительно сбрасываем секунды и миллисекунды для всех сравнений
        const lStart = new Date(lesson.date)
        lStart.setSeconds(0, 0)
        const lStartMs = lStart.getTime()
        const lEndMs = lStartMs + (lesson.duration * 60 * 1000)

        const sTime = new Date(date)
        sTime.setSeconds(0, 0)
        const sTimeMs = sTime.getTime()
        const eTimeMs = sTimeMs + (duration * 60 * 1000)

        // Уроки пересекаются только если интервалы накладываются друг на друга.
        // Строгие неравенства позволяют урокам идти "встык" (например, 19:00-20:00 и 20:00-21:00).
        return lStartMs < eTimeMs && lEndMs > sTimeMs
    })

    return conflict
}

export async function checkRecurringConflicts(
    userId: string,
    dates: Date[],
    duration: number,
    excludeLessonId?: string
) {
    if (dates.length === 0) return null

    const sortedDates = [...dates].sort((a, b) => a.getTime() - b.getTime())
    const startRange = addMinutes(sortedDates[0], -24 * 60)
    const endRange = addMinutes(sortedDates[sortedDates.length - 1], duration + 24 * 60)

    const existingLessons = await prisma.lesson.findMany({
        where: {
            ownerId: userId,
            isCanceled: false,
            id: excludeLessonId ? { not: excludeLessonId } : undefined,
            date: {
                gte: startRange,
                lt: endRange
            }
        },
        include: { student: true, subject: true }
    })

    for (const date of dates) {
        const sTime = new Date(date)
        sTime.setSeconds(0, 0)
        const sTimeMs = sTime.getTime()
        const eTimeMs = sTimeMs + (duration * 60 * 1000)

        const conflict = existingLessons.find(l => {
            const lStart = new Date(l.date)
            lStart.setSeconds(0, 0)
            const lStartMs = lStart.getTime()
            const lEndMs = lStartMs + (l.duration * 60 * 1000)

            return lStartMs < eTimeMs && lEndMs > sTimeMs
        })

        if (conflict) return conflict
    }
    return null
}

export function formatConflictMessage(
    conflict: any,
    newStudentId?: string,
    timezone: string = 'Europe/Moscow',
    isStudentView: boolean = false
) {
    const startTime = new Date(conflict.date)
    const endTime = addMinutes(startTime, conflict.duration)
    const subjectName = conflict.subject?.name || 'Без предмета'

    let dateStr = format(startTime, 'd MMMM', { locale: ru })
    if (isToday(startTime)) dateStr = 'сегодня'
    if (isTomorrow(startTime)) dateStr = 'завтра'

    // Используем Intl.DateTimeFormat для корректного отображения времени с учетом часового пояса
    const timeFormatter = new Intl.DateTimeFormat('ru-RU', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: timezone
    })
    const timeRange = `${timeFormatter.format(startTime)} - ${timeFormatter.format(endTime)}`

    if (isStudentView) {
        return `В это время у преподавателя уже есть урок (${dateStr} с ${timeRange})`
    }

    if (newStudentId && conflict.studentId === newStudentId) {
        return `Ученик уже занят ${dateStr} с ${timeRange} (${subjectName})`
    } else {
        const studentName = conflict.student?.name || conflict.group?.name || 'неизвестный ученик'
        return `Наслоение! У вас уже есть занятие с ${studentName} ${dateStr} с ${timeRange} по предмету "${subjectName}"`
    }
}
