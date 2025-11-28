import { Lesson, LessonFilter } from '@/types'
import { isPast, isFuture } from 'date-fns'

/**
 * Filters lessons based on the selected filter type
 */
export function filterLessons(lessons: Lesson[], filter: LessonFilter): Lesson[] {
    const now = new Date()

    switch (filter) {
        case 'upcoming':
            return lessons.filter(
                (lesson) => isFuture(new Date(lesson.date)) && !lesson.isCanceled
            )
        case 'past':
            return lessons.filter(
                (lesson) => isPast(new Date(lesson.date)) && !lesson.isCanceled
            )
        case 'unpaid':
            return lessons.filter((lesson) => !lesson.isPaid && !lesson.isCanceled)
        case 'canceled':
            return lessons.filter((lesson) => lesson.isCanceled)
        default:
            return lessons
    }
}

/**
 * Calculates total earnings from lessons
 */
export function calculateTotalEarnings(lessons: Lesson[]): number {
    return lessons
        .filter((lesson) => lesson.isPaid)
        .reduce((sum, lesson) => sum + lesson.price, 0)
}

/**
 * Calculates potential earnings from unpaid lessons
 */
export function calculatePotentialEarnings(lessons: Lesson[]): number {
    return lessons
        .filter((lesson) => !lesson.isPaid && !lesson.isCanceled)
        .reduce((sum, lesson) => sum + lesson.price, 0)
}

/**
 * Groups lessons by date
 */
export function groupLessonsByDate(lessons: Lesson[]): Record<string, Lesson[]> {
    return lessons.reduce((acc, lesson) => {
        const date = new Date(lesson.date).toDateString()
        if (!acc[date]) {
            acc[date] = []
        }
        acc[date].push(lesson)
        return acc
    }, {} as Record<string, Lesson[]>)
}
