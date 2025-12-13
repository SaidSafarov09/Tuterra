import { addMinutes, format } from 'date-fns'

/**
 * Calculate lesson end time based on start time and duration
 @param startDate - Lesson start date/time
 * @param durationMinutes - Duration in minutes
 * @returns End time as Date object
 */
export function calculateLessonEndTime(startDate: Date, durationMinutes: number): Date {
    return addMinutes(startDate, durationMinutes)
}

/**
 * Format lesson end time for display
 * @param startDate - Lesson start date/time
 * @param durationMinutes - Duration in minutes
 * @returns Formatted string like "До 17:00"
 */
export function formatLessonEndTime(startDate: Date, durationMinutes: number): string {
    const endTime = calculateLessonEndTime(startDate, durationMinutes)
    return `До ${format(endTime, 'HH:mm')}`
}

/**
 * Format lesson duration for display
 * @param durationMinutes - Duration in minutes
 * @returns Formatted string like "1 час" or "30 мин"
 */
export function formatLessonDuration(durationMinutes: number): string {
    if (durationMinutes < 60) {
        return `${durationMinutes} мин`
    }

    const hours = durationMinutes / 60
    if (hours === 1) {
        return '1 час'
    }
    if (hours === 1.5) {
        return '1,5 часа'
    }
    if (hours === 2) {
        return '2 часа'
    }

    return `${hours} ч`
}

/**
 * Get full lesson time info for display
 * @param startDate - Lesson start date/time
 * @param durationMinutes - Duration in minutes (default 60)
 * @returns 
 */
export function getLessonTimeInfo(startDate: Date, durationMinutes: number = 60): string {
    const endTime = formatLessonEndTime(startDate, durationMinutes)
    const duration = formatLessonDuration(durationMinutes)
    return `${endTime}, ${duration}`
}

/**
 * Определяет статус занятия с учетом времени начала и длительности
 * @param startDate - Дата и время начала занятия
 * @param durationMinutes - Длительность занятия в минутах (по умолчанию 60)
 * @returns 'upcoming' | 'ongoing' | 'past'
 */
export function getLessonStatus(startDate: Date | string, durationMinutes: number = 60): 'upcoming' | 'ongoing' | 'past' {
    const now = new Date()
    const start = new Date(startDate)
    const end = calculateLessonEndTime(start, durationMinutes)
    
    if (now < start) {
        return 'upcoming'
    } else if (now >= start && now < end) {
        return 'ongoing'
    } else {
        return 'past'
    }
}

/**
 * Проверяет, является ли занятие прошедшим (учитывая длительность)
 * @param startDate - Дата и время начала занятия
 * @param durationMinutes - Длительность занятия в минутах (по умолчанию 60)
 * @returns true если занятие полностью закончилось
 */
export function isLessonPast(startDate: Date | string, durationMinutes: number = 60): boolean {
    return getLessonStatus(startDate, durationMinutes) === 'past'
}

/**
 * Проверяет, идет ли занятие сейчас
 * @param startDate - Дата и время начала занятия
 * @param durationMinutes - Длительность занятия в минутах (по умолчанию 60)
 * @returns true если занятие началось, но еще не закончилось
 */
export function isLessonOngoing(startDate: Date | string, durationMinutes: number = 60): boolean {
    return getLessonStatus(startDate, durationMinutes) === 'ongoing'
}
