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
