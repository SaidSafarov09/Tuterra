import { addDays, addWeeks, startOfDay, isBefore, isAfter, isSameDay } from 'date-fns'
import type { RecurrenceRule, RecurrenceType } from '@/types/recurring'

interface GenerateRecurringDatesOptions {
    startDate: Date
    rule: RecurrenceRule
    limit?: number
    endDate?: Date
}

export function generateRecurringDates({
    startDate,
    rule,
    limit = 100,
    endDate: hardEndDate,
}: GenerateRecurringDatesOptions): Date[] {
    if (!rule.enabled) {
        return [startDate]
    }

    
    const dates: Date[] = [new Date(startDate)]

    
    let effectiveLimit = limit
    if (rule.endType === 'count' && rule.occurrencesCount) {
        effectiveLimit = Math.min(limit, rule.occurrencesCount)

        
        
        
        effectiveLimit += 1
    }

    
    if (dates.length >= effectiveLimit) {
        return dates
    }

    let calculatedEndDate = hardEndDate

    if (rule.endType === 'until_date' && rule.endDate) {
        
        const date = new Date(rule.endDate)
        date.setHours(23, 59, 59, 999)
        calculatedEndDate = date
    } else if (rule.endType === 'count' && rule.occurrencesCount) {
        
        
    }

    if (hardEndDate && (!calculatedEndDate || isAfter(calculatedEndDate, hardEndDate))) {
        calculatedEndDate = hardEndDate
    }

    
    
    

    
    

    switch (rule.type) {
        case 'daily':
            generateDailyDates(startDate, calculatedEndDate || null, dates, effectiveLimit)
            break

        case 'weekly':
            generateWeeklyDates(startDate, calculatedEndDate || null, rule.daysOfWeek, dates, effectiveLimit)
            break

        case 'every_x_weeks':
            generateEveryXWeeksDates(
                startDate,
                calculatedEndDate || null,
                rule.interval || 1,
                rule.daysOfWeek,
                dates,
                effectiveLimit
            )
            break
    }

    return dates
}

export function getRecurrenceDescription(rule: RecurrenceRule, startDate: Date): string {
    if (!rule.enabled) {
        return ''
    }

    const parts: string[] = []

    
    switch (rule.type) {
        case 'daily':
            parts.push('Каждый день')
            break

        case 'weekly':
            const daysArray: number[] = typeof rule.daysOfWeek === 'string' ? JSON.parse(rule.daysOfWeek || '[]') : rule.daysOfWeek;
            if (daysArray.length === 1) {
                parts.push(`Каждую ${getWeekdayName(daysArray[0], 'accusative')}`)
            } else if (daysArray.length > 1) {
                const days = daysArray
                    .sort((a: number, b: number) => a - b)
                    .map((d: number) => getWeekdayName(d, 'short'))
                    .join(', ')
                parts.push(`Каждую неделю: ${days}`)
            }
            break

        case 'every_x_weeks':
            const interval = rule.interval || 1
            const weeksText = interval === 1 ? 'неделю' : `${interval} ${getPluralWeeks(interval)}`
            parts.push(`Каждые ${weeksText}`)
            const daysArray2: number[] = typeof rule.daysOfWeek === 'string' ? JSON.parse(rule.daysOfWeek || '[]') : rule.daysOfWeek;
            if (daysArray2.length > 0) {
                const days = daysArray2.map((d: number) => getWeekdayName(d, 'short')).join(', ')
                parts.push(`(${days})`)
            }
            break
    }

    
    const hours = startDate.getHours().toString().padStart(2, '0')
    const minutes = startDate.getMinutes().toString().padStart(2, '0')
    parts.push(`в ${hours}:${minutes}`)

    
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
    const daysArray = typeof rule.daysOfWeek === 'string' ? JSON.parse(rule.daysOfWeek || '[]') : rule.daysOfWeek;
    if ((rule.type === 'weekly' || rule.type === 'every_x_weeks') && daysArray.length === 0) {
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
        
        const date = new Date(rule.endDate)
        date.setHours(23, 59, 59, 999)
        endDate = date
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
    let currentDate = addDays(startDate, 1) 

    while (dates.length < limit) {
        if (endDate && isAfter(currentDate, endDate)) {
            break
        }

        dates.push(new Date(currentDate))
        currentDate = addDays(currentDate, 1)
    }
}

function generateWeeklyDates(
    startDate: Date,
    endDate: Date | null,
    daysOfWeek: number[] | string,
    dates: Date[],
    limit: number
): void {
    const daysArray = typeof daysOfWeek === 'string' ? JSON.parse(daysOfWeek || '[]') : daysOfWeek;
    if (daysArray.length === 0) return

    const sortedDays = [...daysArray].sort((a, b) => a - b)
    let currentWeekStart = startOfDay(startDate)
    currentWeekStart = addDays(currentWeekStart, -currentWeekStart.getDay())

    const hours = startDate.getHours()
    const minutes = startDate.getMinutes()

    let weeksChecked = 0
    const maxWeeksToCheck = 1000
    const normalizedStart = new Date(startDate)
    normalizedStart.setSeconds(0, 0)

    while (dates.length < limit && weeksChecked < maxWeeksToCheck) {
        for (const dayOfWeek of sortedDays) {
            let targetDate = addDays(currentWeekStart, dayOfWeek)
            targetDate.setHours(hours, minutes, 0, 0)
            if (targetDate > normalizedStart) {
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
        weeksChecked++
    }
}

function generateEveryXWeeksDates(
    startDate: Date,
    endDate: Date | null,
    interval: number,
    daysOfWeek: number[] | string,
    dates: Date[],
    limit: number
): void {
    const daysArray = typeof daysOfWeek === 'string' ? JSON.parse(daysOfWeek || '[]') : daysOfWeek;
    if (daysArray.length === 0) return

    const sortedDays = [...daysArray].sort((a, b) => a - b)

    let currentWeekStart = startOfDay(startDate)
    currentWeekStart = addDays(currentWeekStart, -currentWeekStart.getDay())

    const hours = startDate.getHours()
    const minutes = startDate.getMinutes()

    let weeksChecked = 0
    const maxWeeksToCheck = 1000

    
    const normalizedStart = new Date(startDate)
    normalizedStart.setSeconds(0, 0)

    while (dates.length < limit && weeksChecked < maxWeeksToCheck) {
        for (const dayOfWeek of sortedDays) {
            let targetDate = addDays(currentWeekStart, dayOfWeek)
            targetDate.setHours(hours, minutes, 0, 0)

            
            if (targetDate > normalizedStart) {
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
        weeksChecked++
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
