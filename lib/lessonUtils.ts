import { isSameDay } from 'date-fns'
import { Lesson, DayData } from '@/types'

/**
 * Calculate earnings for a specific day
 */
export function calculateDayEarnings(lessons: Lesson[], date: Date): DayData {
    const dayLessons = lessons.filter(lesson =>
        isSameDay(new Date(lesson.date), date)
    )

    const totalEarned = dayLessons
        .filter(l => l.isPaid)
        .reduce((sum, l) => sum + l.price, 0)

    const potentialEarnings = dayLessons
        .filter(l => !l.isPaid && !l.isCanceled)
        .reduce((sum, l) => sum + l.price, 0)

    return {
        lessons: dayLessons,
        totalEarned,
        potentialEarnings
    }
}

/**
 * Calculate total paid earnings for lessons on a specific day
 */
export function calculateDayPaidEarnings(lessons: Lesson[], date: Date): number {
    return lessons
        .filter(lesson => isSameDay(new Date(lesson.date), date) && lesson.isPaid)
        .reduce((sum, lesson) => sum + lesson.price, 0)
}
