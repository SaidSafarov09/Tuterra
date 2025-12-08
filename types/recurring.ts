export type RecurrenceType = 'weekly' | 'daily' | 'every_x_weeks'
export type RecurrenceEndType = 'never' | 'until_date' | 'count'

export interface RecurrenceRule {
    enabled: boolean
    type: RecurrenceType
    interval: number 
    daysOfWeek: number[] 
    endType: RecurrenceEndType
    endDate?: Date | string
    occurrencesCount?: number
}

export interface LessonSeriesData {
    id: string
    userId: string
    type: RecurrenceType
    interval: number
    daysOfWeek: number[]
    startDate: Date | string
    endDate?: Date | string | null
    occurrencesCount?: number | null

    
    studentId: string
    subjectId?: string | null
    price: number
    topic?: string | null
    notes?: string | null

    createdAt: Date | string
    updatedAt: Date | string
}

export interface RecurringLessonFormData {
    
    studentId: string
    subjectId?: string
    date: Date
    price: number
    topic?: string
    notes?: string

    
    recurrence: RecurrenceRule
}


export const WEEKDAY_NAMES = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'] as const
export const WEEKDAY_NAMES_FULL = [
    'Воскресенье',
    'Понедельник',
    'Вторник',
    'Среда',
    'Четверг',
    'Пятница',
    'Суббота'
] as const

export const RECURRENCE_TYPE_LABELS: Record<RecurrenceType, string> = {
    weekly: 'Каждую неделю',
    daily: 'Каждый день',
    every_x_weeks: 'Каждые X недель'
}

export const RECURRENCE_END_TYPE_LABELS: Record<RecurrenceEndType, string> = {
    never: 'Бессрочно',
    until_date: 'До даты',
    count: 'Количество повторений'
}
