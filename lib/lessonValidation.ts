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
    const searchStart = addMinutes(startTime, -24 * 60)

    const candidates = await prisma.lesson.findMany({
        where: {
            ownerId: userId,
            isCanceled: false,
            id: excludeLessonId ? { not: excludeLessonId } : undefined,
            date: {
                gte: searchStart,
                lt: endTime,
            },
        },
        include: {
            subject: true,
            student: true,
        },
    })

    const conflict = candidates.find((lesson) => {
        const lessonStart = new Date(lesson.date)
        const lessonEnd = addMinutes(lessonStart, lesson.duration)

        return lessonStart < endTime && lessonEnd > startTime
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
    const endRange = addMinutes(sortedDates[sortedDates.length - 1], duration)

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
        const newStart = date
        const newEnd = addMinutes(date, duration)

        const conflict = existingLessons.find(l => {
            const lStart = new Date(l.date)
            const lEnd = addMinutes(lStart, l.duration)
            return lStart < newEnd && lEnd > newStart
        })

        if (conflict) return conflict
    }
    return null
}

export function formatConflictMessage(conflict: any, newStudentId?: string) {
    const startTime = new Date(conflict.date)
    const endTime = addMinutes(startTime, conflict.duration)
    const subjectName = conflict.subject?.name || 'Без предмета'

    let dateStr = format(startTime, 'd MMMM', { locale: ru })
    if (isToday(startTime)) dateStr = 'сегодня'
    if (isTomorrow(startTime)) dateStr = 'завтра'

    const timeRange = `${format(startTime, 'HH:mm')} - ${format(endTime, 'HH:mm')}`

    if (newStudentId && conflict.studentId === newStudentId) {
        return `Ученик уже занят ${dateStr} с ${timeRange} (${subjectName})`
    } else {
        const studentName = conflict.student?.name || conflict.group?.name || 'неизвестный ученик'
        return `Наслоение! У вас уже есть занятие с ${studentName} ${dateStr} с ${timeRange} по предмету "${subjectName}"`
    }
}
