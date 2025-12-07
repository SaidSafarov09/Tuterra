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
    slug?: string
    name: string
    email?: string
    phone?: string
    contact?: string | null
    avatar?: string
    subjects: Subject[]
    notes?: string
    note?: string | null
    lessons?: {
        id: string
        date: string
        price: number
        isPaid: boolean
        isCanceled: boolean
        topic?: string
        notes?: string
        subject?: {
            id: string
            name: string
            color: string
        } | null
    }[]
    _count?: {
        lessons: number
    }
}

export interface Lesson {
    id: string
    slug?: string
    date: string
    price: number
    isPaid: boolean
    isCanceled: boolean
    isTrial?: boolean
    notes?: string
    topic?: string
    duration?: number
    seriesId?: string | null
    student: {
        id: string
        name: string
    }
    subject?: {
        id: string
        name: string
        color: string
    } | null
}

export interface DashboardStats {
    studentsCount: number
    upcomingLessons: Lesson[]
    unpaidLessons: Lesson[]
    monthlyIncome: number
    totalLessons?: number
    subjectsCount?: number
    createdAt?: string
}

export interface DayData {
    lessons: Lesson[]
    totalEarned: number
    potentialEarnings: number
}

export interface MonthlyData {
    month: string
    income: number
    lessons: number
    paid: number
    unpaid: number
}

import type { RecurrenceRule } from './recurring'

export interface LessonFormData {
    studentId: string
    subjectId: string
    date: Date
    price: string
    isPaid: boolean
    isPaidAll?: boolean
    isTrial?: boolean
    notes: string
    topic: string
    duration: number
    recurrence?: RecurrenceRule
    seriesPrice?: string
}

export type LessonFilter = 'all' | 'upcoming' | 'past' | 'unpaid' | 'canceled'
export type SubjectFilter = 'all' | string