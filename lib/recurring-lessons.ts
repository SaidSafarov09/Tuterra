import { addDays, addWeeks, startOfDay, isBefore, isAfter, isSameDay } from 'date-fns'
import type { RecurrenceRule, RecurrenceType } from '@/types/recurring'

interface GenerateRecurringDatesOptions {
    startDate: Date
    rule: RecurrenceRule
    limit?: number
    endDate?: Date
}

export function generateRecurringDates(options: GenerateRecurringDatesOptions): Date[] {
    const { startDate, rule, limit = 100, endDate: hardEndDate } = options

    if (!rule.enabled) {
        return [startDate]
    }

    const dates: Date[] = []
    const start = startOfDay(startDate)

    const endDate = getRecurrenceEndDate(start, rule, hardEndDate)
    switch (rule.type) {
        case 'daily':
            generateDailyDates(start, endDate, dates, limit)
            break

        case 'weekly':
            generateWeeklyDates(start, endDate, rule.daysOfWeek, dates, limit)
            break

        case 'every_x_weeks':
            generateEveryXWeeksDates(start, endDate, rule.interval, rule.daysOfWeek, dates, limit)
            break
    }

    return dates
}
export function getRecurrenceDescription(rule: RecurrenceRule, startDate: Date): string {
    if (!rule.enabled) {
        return ''
    }

    const parts: string[] = []

    // Type description
    switch (rule.type) {
        case 'daily':
            parts.push('Каждый день')
            break

        case 'weekly':
            if (rule.daysOfWeek.length === 1) {
                parts.push(`Каждую ${getWeekdayName(rule.daysOfWeek[0], 'accusative')}`)
            } else if (rule.daysOfWeek.length > 1) {
                const days = rule.daysOfWeek
                    .sort((a, b) => a - b)
                    .map(d => getWeekdayName(d, 'short'))
                    .join(', ')
                parts.push(`Каждую неделю: ${days}`)
            }
            break

        case 'every_x_weeks':
            const interval = rule.interval || 1
            const weeksText = interval === 1 ? 'неделю' : `${interval} ${getPluralWeeks(interval)}`
            parts.push(`Каждые ${weeksText}`)
            if (rule.daysOfWeek.length > 0) {
                const days = rule.daysOfWeek.map(d => getWeekdayName(d, 'short')).join(', ')
                parts.push(`(${days})`)
            }
            break
    }

    // Time from startDate
    const hours = startDate.getHours().toString().padStart(2, '0')
    const minutes = startDate.getMinutes().toString().padStart(2, '0')
    parts.push(`в ${hours}:${minutes}`)

    // End description
    if (rule.endType === 'until_date' && rule.endDate) {
        const date = new Date(rule.endDate)
        parts.push(`до ${date.toLocaleDateString('ru-RU')}`)
    } else if (rule.endType === 'count' && rule.occurrencesCount) {
        parts.push(`(${rule.occurrencesCount} ${getPluralLessons(rule.occurrencesCount)})`)
    }

    return parts.join(' ')
}

export function validateRecurrenceRule(rule: RecurrenceRule): { valid: boolean; error?: string } {
    if (!rule.enabled) {
        return { valid: true }
    }
    if ((rule.type === 'weekly' || rule.type === 'every_x_weeks') && rule.daysOfWeek.length === 0) {
        return { valid: false, error: 'Выберите хотя бы один день недели' }
    }

    if (rule.type === 'every_x_weeks' && (!rule.interval || rule.interval < 1)) {
        return { valid: false, error: 'Интервал должен быть больше 0' }
    }

    if (rule.endType === 'until_date') {
        if (!rule.endDate) {
            return { valid: false, error: 'Укажите дату окончания' }
        }
    } else if (rule.endType === 'count') {
        if (!rule.occurrencesCount || rule.occurrencesCount < 1) {
            return { valid: false, error: 'Количество повторений должно быть больше 0' }
        }
    }

    return { valid: true }
}

function getRecurrenceEndDate(
    startDate: Date,
    rule: RecurrenceRule,
    hardEndDate?: Date
): Date | null {
    let endDate: Date | null = null

    if (rule.endType === 'until_date' && rule.endDate) {
        endDate = new Date(rule.endDate)
    } else if (rule.endType === 'count' && rule.occurrencesCount) {
        const daysToAdd = rule.occurrencesCount * (rule.type === 'daily' ? 1 : 7)
        endDate = addDays(startDate, daysToAdd)
    }

    if (hardEndDate && (!endDate || isAfter(endDate, hardEndDate))) {
        endDate = hardEndDate
    }

    return endDate
}

function generateDailyDates(
    startDate: Date,
    endDate: Date | null,
    dates: Date[],
    limit: number
): void {
    let currentDate = startDate

    while (dates.length < limit) {
        dates.push(new Date(currentDate))

        if (endDate && isAfter(currentDate, endDate)) {
            break
        }

        currentDate = addDays(currentDate, 1)
    }
}

function generateWeeklyDates(
    startDate: Date,
    endDate: Date | null,
    daysOfWeek: number[],
    dates: Date[],
    limit: number
): void {
    if (daysOfWeek.length === 0) return

    const sortedDays = [...daysOfWeek].sort((a, b) => a - b)
    let currentWeekStart = startOfDay(startDate)

    while (dates.length < limit) {
        for (const dayOfWeek of sortedDays) {
            const targetDate = getDateForDayOfWeek(currentWeekStart, dayOfWeek)

            // Only include dates on or after start date
            if (!isBefore(targetDate, startDate)) {
                if (endDate && isAfter(targetDate, endDate)) {
                    return
                }

                dates.push(targetDate)

                if (dates.length >= limit) {
                    return
                }
            }
        }

        currentWeekStart = addWeeks(currentWeekStart, 1)
    }
}

function generateEveryXWeeksDates(
    startDate: Date,
    endDate: Date | null,
    interval: number,
    daysOfWeek: number[],
    dates: Date[],
    limit: number
): void {
    if (daysOfWeek.length === 0) return

    const sortedDays = [...daysOfWeek].sort((a, b) => a - b)
    let currentWeekStart = startOfDay(startDate)

    while (dates.length < limit) {
        for (const dayOfWeek of sortedDays) {
            const targetDate = getDateForDayOfWeek(currentWeekStart, dayOfWeek)

            if (!isBefore(targetDate, startDate)) {
                if (endDate && isAfter(targetDate, endDate)) {
                    return
                }

                dates.push(targetDate)

                if (dates.length >= limit) {
                    return
                }
            }
        }

        currentWeekStart = addWeeks(currentWeekStart, interval)
    }
}

function getDateForDayOfWeek(weekStart: Date, targetDayOfWeek: number): Date {
    const currentDayOfWeek = weekStart.getDay()
    const daysToAdd = (targetDayOfWeek - currentDayOfWeek + 7) % 7
    return addDays(weekStart, daysToAdd)
}

function getWeekdayName(dayOfWeek: number, format: 'short' | 'full' | 'accusative'): string {
    const names = {
        short: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],
        full: ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'],
        accusative: ['воскресенье', 'понедельник', 'вторник', 'среду', 'четверг', 'пятницу', 'субботу']
    }

    return names[format][dayOfWeek] || ''
}

function getPluralWeeks(count: number): string {
    const mod10 = count % 10
    const mod100 = count % 100

    if (mod10 === 1 && mod100 !== 11) return 'неделя'
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'недели'
    return 'недель'
}

function getPluralLessons(count: number): string {
    const mod10 = count % 10
    const mod100 = count % 100

    if (mod10 === 1 && mod100 !== 11) return 'урок'
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'урока'
    return 'уроков'
}
