// Core domain types
export interface Student {
    id: string
    name: string
    email?: string
    phone?: string
    avatar?: string
    subjects: Subject[]
}

export interface Subject {
    id: string
    name: string
    color: string
}

export interface Lesson {
    id: string
    date: string
    price: number
    isPaid: boolean
    isCanceled: boolean
    notes?: string
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

// Stats types
export interface DashboardStats {
    studentsCount: number
    upcomingLessons: Lesson[]
    unpaidLessons: Lesson[]
    monthlyIncome: number
}

export interface DayData {
    lessons: Lesson[]
    totalEarned: number
    potentialEarnings: number
}

// Form types
export interface LessonFormData {
    studentId: string
    subjectId: string
    date: Date
    price: string
    isPaid: boolean
    notes: string
}

// Filter types
export type LessonFilter = 'all' | 'upcoming' | 'past' | 'unpaid' | 'canceled'
export type SubjectFilter = 'all' | string
