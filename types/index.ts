export interface Subject {
    id: string
    name: string
    color: string
    _count?: {
        students: number
        lessons: number
    }
}

export interface Student {
    id: string
    name: string
    slug?: string
    contact?: string | null
    contactType?: string | null
    parentContact?: string | null
    parentContactType?: string | null
    note?: string | null
    createdAt?: string
    updatedAt?: string
    subjects?: Subject[]
    groups?: { id: string; name: string }[]
    _count?: {
        lessons: number
    }
}

export interface Lesson {
    id: string
    date: string
    price: number
    isPaid: boolean
    isCanceled: boolean
    isTrial?: boolean
    notes?: string | null
    topic?: string | null
    duration: number
    slug?: string
    student: {
        id: string
        name: string
        slug?: string
    }
    subject?: {
        id: string
        name: string
        color: string
    } | null
    subjectName?: string | null
    subjectColor?: string | null
    group?: {
        id: string
        name: string
    } | null
    seriesId?: string | null
    series?: {
        id: string
        type: string
        interval: number
        daysOfWeek: number[]
        endDate?: string | null
        occurrencesCount?: number | null
    } | null
}

export interface LessonFormData {
    studentId: string
    groupId?: string
    subjectId?: string
    date?: Date
    price: string | number
    isPaid: boolean
    isCanceled?: boolean
    isTrial?: boolean
    notes?: string
    topic?: string
    duration: number
    recurrence?: RecurrenceRule
    isPaidAll?: boolean
    seriesPrice?: number
}

export interface Group {
    id: string
    name: string
    note?: string | null
    createdAt?: string
    updatedAt?: string
    students: Student[]
    subjects?: Subject[]
    _count?: {
        students: number
        lessons: number
        subjects?: number
    }
}

export type LessonFilter = 'all' | 'upcoming' | 'past' | 'unpaid' | 'canceled' | 'trial'

export interface User {
    id: string
    name: string
    email?: string
    phone?: string
    avatar?: string
}

export interface RecurrenceRule {
    enabled: boolean
    type: 'daily' | 'weekly' | 'monthly'
    interval: number
    daysOfWeek?: number[]
    endType: 'never' | 'count' | 'until_date'
    occurrencesCount?: number
    endDate?: Date
}