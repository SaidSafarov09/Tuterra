export interface Subject {
    id: string
    name: string
    color: string
    groups?: Group[]
    students?: Student[]
    _count?: {
        students: number
        lessons: number
        groups?: number
    }
    learningPlans?: LearningPlan[]
}

export interface LearningPlanTopic {
    id: string
    planId: string
    title: string
    description?: string | null
    order: number
    createdAt: string
    updatedAt: string
    lessons?: Lesson[]
    // Computed fields for UI
    isCompleted?: boolean
    lastLesson?: {
        id: string
        date: string
        topic: string
        student?: { name: string } | null
        group?: { name: string } | null
        subject?: { name: string; color: string } | null
    } | null
}

export interface LearningPlan {
    id: string
    studentId?: string | null
    groupId?: string | null
    subjectId?: string | null
    ownerId: string
    createdAt: string
    updatedAt: string
    topics: LearningPlanTopic[]
    student?: Student
    group?: Group
    subject?: Subject
}

export interface Student {
    id: string
    slug?: string
    name: string
    email?: string
    phone?: string
    contact?: string | null
    contactType?: string | null
    parentContact?: string | null
    parentContactType?: string | null
    avatar?: string
    groups?: Group[]
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
    learningPlans?: LearningPlan[]
    linkedUser?: {
        id: string
        name: string | null
        email: string | null
        phone: string | null
        avatar: string | null
    } | null
    linkedUserId?: string | null
}

export interface Group {
    id: string
    name: string
    subjectId: string
    note?: string
    subject: Subject
    students: Student[]
    lessons?: Lesson[]
    color: string
    _count?: {
        lessons: number
        students: number
    }
    learningPlan?: LearningPlan
}

export interface LessonPayment {
    id: string
    lessonId: string
    studentId: string
    hasPaid: boolean
    student?: {
        id: string
        name: string
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
    subjectName?: string | null
    subjectColor?: string | null
    groupName?: string | null
    student?: {
        slug?: string
        id: string
        name: string
    } | null
    group?: {
        id: string
        name: string
        students?: { id: string; name: string }[]
    } | null
    subject?: {
        id: string
        name: string
        color: string
    } | null
    lessonPayments?: LessonPayment[]
    userHasPaid?: boolean
    planTopicId?: string | null
    planTopic?: LearningPlanTopic
    owner?: {
        id: string
        name: string | null
        firstName: string | null
        avatar: string | null
    } | null
}

export interface DashboardStats {
    studentsCount: number
    groupsCount: number
    teachersCount?: number
    upcomingLessons: Lesson[]
    unpaidLessons: Lesson[]
    monthlyIncome: number
    totalLessons?: number
    totalLessonsCount?: number
    subjectsCount?: number
    monthLessonsCount?: number
    pendingRequests?: any[]
    createdAt?: string
    countConnectedStudents?: number
    countStudentPlans?: number
    countGroupPlans?: number
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
    studentId?: string
    groupId?: string
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
    paidStudentIds?: string[]
    planTopicId?: string | null
}

export type LessonFilter = 'all' | 'upcoming' | 'past' | 'unpaid' | 'canceled'
export type SubjectFilter = 'all' | string