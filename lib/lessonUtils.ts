import type { Lesson, DayData } from '@/types'

export type LessonStatus = 'free' | 'paid' | 'unpaid'

export function getLessonStatus(price: number, isPaid: boolean): LessonStatus {
    if (price === 0) return 'free'
    return isPaid ? 'paid' : 'unpaid'
}

export function isTrial(price: number): boolean {
    return price === 0
}

export function getLessonStatusLabel(status: LessonStatus): string {
    switch (status) {
        case 'free':
            return 'Бесплатный'
        case 'paid':
            return 'Оплачено'
        case 'unpaid':
            return 'Не оплачено'
    }
}

export function getLessonStatusColor(status: LessonStatus): string {
    switch (status) {
        case 'free':
            return '#4A6CF7' // Синий
        case 'paid':
            return '#10B981' // Зеленый
        case 'unpaid':
            return '#EF4444' // Красный
    }
}

export function calculateDayEarnings(lessons: Array<{ price: number; isPaid: boolean }>): number {
    return lessons
        .filter(lesson => lesson.isPaid)
        .reduce((sum, lesson) => sum + lesson.price, 0)
}

export function calculateDayData(lessons: Lesson[], date: Date): DayData {
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)

    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    const dayLessons = lessons.filter(lesson => {
        const lessonDate = new Date(lesson.date)
        return lessonDate >= startOfDay && lessonDate <= endOfDay
    })

    const totalEarned = dayLessons
        .filter(lesson => lesson.isPaid)
        .reduce((sum, lesson) => sum + lesson.price, 0)

    const potentialEarnings = dayLessons
        .filter(lesson => !lesson.isPaid && !lesson.isCanceled)
        .reduce((sum, lesson) => sum + lesson.price, 0)

    return {
        lessons: dayLessons,
        totalEarned,
        potentialEarnings
    }
}
