import { Lesson, Student, Subject } from '@/types'
async function handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'An error occurred' }))
        throw new Error(error?.message || error?.error || 'API request failed')
    }
    if (response.status === 204) {
        return {} as T
    }
    return response.json()
}
const headers = {
    'Content-Type': 'application/json',
}

interface CreateLessonDTO {
    studentId?: string
    groupId?: string
    subjectId: string
    date: string
    duration?: number
    isTrial?: boolean
    price: number
    isPaid: boolean
    notes?: string
    topic?: string
    planTopicId?: string | null
    isCanceled?: boolean
    paidStudentIds?: string[]
    attendedStudentIds?: string[] // Добавляем список присутствовавших студентов
    recurrence?: any
    seriesPrice?: number
    isPaidAll?: boolean
}

interface CreateStudentDTO {
    name: string
    contact?: string
    contactType?: string
    parentContact?: string
    parentContactType?: string
    note?: string
    subjectId?: string
    email?: string
    phone?: string
}

export const lessonsApi = {
    getAll: (filter?: string) =>
        fetch(`/api/lessons${filter ? `?filter=${filter}` : ''}`).then(res => handleResponse<Lesson[]>(res)),

    getById: (id: string) =>
        fetch(`/api/lessons/${id}`).then(res => handleResponse<Lesson>(res)),

    create: (data: CreateLessonDTO) =>
        fetch('/api/lessons', {
            method: 'POST',
            headers,
            body: JSON.stringify(data),
        }).then(res => handleResponse<Lesson>(res)),

    update: (id: string, data: Partial<Lesson> | Partial<CreateLessonDTO>) =>
        fetch(`/api/lessons/${id}`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify(data),
        }).then(res => handleResponse<Lesson>(res)),

    delete: (id: string) =>
        fetch(`/api/lessons/${id}`, {
            method: 'DELETE',
        }).then(res => handleResponse<{ success: boolean }>(res)),

    getStudentLessons: (filter?: string) =>
        fetch(`/api/student/lessons${filter ? `?filter=${filter}` : ''}`).then(res => handleResponse<Lesson[]>(res)),
}

export const studentsApi = {
    getAll: () =>
        fetch('/api/students').then(res => handleResponse<Student[]>(res)),

    getById: (id: string) =>
        fetch(`/api/students/${id}`).then(res => handleResponse<Student>(res)),

    create: (data: CreateStudentDTO) =>
        fetch('/api/students', {
            method: 'POST',
            headers,
            body: JSON.stringify(data),
        }).then(res => handleResponse<Student>(res)),

    update: (id: string, data: Partial<Student>) =>
        fetch(`/api/students/${id}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify(data),
        }).then(res => handleResponse<Student>(res)),

    delete: (id: string) =>
        fetch(`/api/students/${id}`, {
            method: 'DELETE',
        }).then(res => handleResponse<{ success: boolean }>(res)),
}

export const subjectsApi = {
    getAll: () =>
        fetch('/api/subjects').then(res => handleResponse<Subject[]>(res)),

    getById: (id: string) =>
        fetch(`/api/subjects/${id}`).then(res => handleResponse<Subject>(res)),

    create: (data: { name: string; color: string }) =>
        fetch('/api/subjects', {
            method: 'POST',
            headers,
            body: JSON.stringify(data),
        }).then(res => handleResponse<Subject>(res)),

    update: (id: string, data: { name: string; color: string }) =>
        fetch(`/api/subjects/${id}`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify(data),
        }).then(res => handleResponse<Subject>(res)),

    delete: (id: string) =>
        fetch(`/api/subjects/${id}`, {
            method: 'DELETE',
        }).then(res => handleResponse<{ success: boolean; deletedLessonsCount?: number }>(res)),

    getStudents: (id: string) =>
        fetch(`/api/subjects/${id}/students`).then(res => handleResponse<Student[]>(res)),

    linkStudent: (subjectId: string, studentId: string) =>
        fetch(`/api/subjects/${subjectId}/students/link`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ studentId }),
        }).then(res => handleResponse<{ success: boolean }>(res)),

    unlinkStudent: (subjectId: string, studentId: string) =>
        fetch(`/api/subjects/${subjectId}/students/link`, {
            method: 'DELETE',
            headers,
            body: JSON.stringify({ studentId }),
        }).then(res => handleResponse<{ success: boolean }>(res)),
}

export const groupsApi = {
    getAll: () =>
        fetch('/api/groups').then(res => handleResponse<import('@/types').Group[]>(res)),

    getById: (id: string) =>
        fetch(`/api/groups/${id}`).then(res => handleResponse<import('@/types').Group>(res)),

    create: (data: { name: string; subjectId: string; studentIds?: string[] }) =>
        fetch('/api/groups', {
            method: 'POST',
            headers,
            body: JSON.stringify(data),
        }).then(res => handleResponse<import('@/types').Group>(res)),

    update: (id: string, data: { name?: string; subjectId?: string; studentIds?: string[] }) =>
        fetch(`/api/groups/${id}`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify(data),
        }).then(res => handleResponse<import('@/types').Group>(res)),

    delete: (id: string) =>
        fetch(`/api/groups/${id}`, {
            method: 'DELETE',
        }).then(res => handleResponse<{ success: boolean }>(res)),
}

export const plansApi = {
    getAll: (params: { studentId?: string; groupId?: string; subjectId?: string }) => {
        const query = new URLSearchParams(params as any).toString()
        return fetch(`/api/plans?${query}`).then(res => handleResponse<import('@/types').LearningPlan[]>(res))
    },

    getById: (id: string) =>
        fetch(`/api/plans/${id}`).then(res => handleResponse<import('@/types').LearningPlan>(res)),

    create: (data: { studentId?: string | null; groupId?: string | null; subjectId?: string | null }) =>
        fetch('/api/plans', {
            method: 'POST',
            headers,
            body: JSON.stringify(data),
        }).then(res => handleResponse<import('@/types').LearningPlan>(res)),

    update: (id: string, data: { topics?: Partial<import('@/types').LearningPlanTopic>[] }) =>
        fetch(`/api/plans/${id}`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify(data),
        }).then(res => handleResponse<import('@/types').LearningPlan>(res)),

    delete: (id: string) =>
        fetch(`/api/plans/${id}`, {
            method: 'DELETE',
        }).then(res => handleResponse<{ success: boolean }>(res)),
}

interface IncomeData {
    monthlyData: any[]
    currentMonthIncome: number
    previousMonthIncome: number
    currentLessonsCount: number
    previousLessonsCount: number
    averageCheck: number
    previousAverageCheck: number
    hasAnyIncomeEver: boolean
    currentMonthDuration: number
    previousMonthDuration: number
    recentTransactions: any[]
    debts: any[]
    insights: any[]
    isPro: boolean
}

export const incomeApi = {
    get: (date: string) =>
        fetch(`/api/income?date=${date}`).then(res => handleResponse<IncomeData>(res)),
    getTransactions: (filter: string) =>
        fetch(`/api/income/transactions?filter=${filter}`).then(res => handleResponse<{ transactions: any[] }>(res)),
}

interface UserSettings {
    id: string
    firstName: string
    lastName: string
    name?: string
    email: string
    phone?: string
    avatar?: string | null
    birthDate?: string | null
    country?: string | null
    region?: string | null
    timezone?: string
    currency?: string
    hasOAuthProvider?: boolean
    theme?: string
    notificationSettings?: NotificationSettingsDTO
    telegramId?: string | null
    referralCode?: string | null
    role: 'teacher' | 'student'
    showProgressBlock?: boolean
    showInsightsBlock?: boolean
    onboardingCompleted?: boolean
    plan?: 'free' | 'pro'
    isPro?: boolean
    proActivatedAt?: string | null
    proExpiresAt?: string | null
}

export interface NotificationSettingsDTO {
    lessonReminders: boolean
    unpaidLessons: boolean
    statusChanges: boolean
    incomeReports: boolean
    studentDebts: boolean
    missingLessons: boolean
    onboardingTips: boolean
    deliveryWeb: boolean
    deliveryTelegram: boolean
    quietHoursEnabled: boolean
    quietHoursStart: string
    quietHoursEnd: string
}

export const settingsApi = {
    get: () =>
        fetch('/api/settings', { cache: 'no-store' }).then(res => handleResponse<UserSettings>(res)),

    update: (data: Partial<UserSettings>) =>
        fetch('/api/settings', {
            method: 'PUT',
            headers,
            body: JSON.stringify(data),
        }).then(res => handleResponse<UserSettings>(res)),

    generateTelegramAuthCode: () =>
        fetch('/api/user/telegram-auth', { method: 'POST' }).then(res => handleResponse<{ code: string }>(res)),
}

export const notificationsApi = {
    getAll: () =>
        fetch('/api/notifications').then(res => handleResponse<any[]>(res)),

    markAsRead: (id: string) =>
        fetch(`/api/notifications/${id}`, { method: 'POST' }).then(res => handleResponse<any>(res)),

    markAllAsRead: () =>
        fetch('/api/notifications/read-all', { method: 'POST' }).then(res => handleResponse<any>(res)),

    delete: (id: string) =>
        fetch(`/api/notifications/${id}`, { method: 'DELETE' }).then(res => handleResponse<any>(res)),

    getSettings: () =>
        fetch('/api/notifications/settings').then(res => handleResponse<NotificationSettingsDTO>(res)),

    updateSettings: (data: Partial<NotificationSettingsDTO>) =>
        fetch('/api/notifications/settings', {
            method: 'PUT',
            headers,
            body: JSON.stringify(data),
        }).then(res => handleResponse<NotificationSettingsDTO>(res)),
}

export const statsApi = {
    get: () =>
        fetch('/api/stats').then(res => handleResponse<import('@/types').DashboardStats>(res)),
}
