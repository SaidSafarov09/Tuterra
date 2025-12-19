import { Lesson, Student, Subject } from '@/types'
async function handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'An error occurred' }))
        throw new Error(error.message || error.error || 'API request failed')
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
    isCanceled?: boolean
    paidStudentIds?: string[]
    attendedStudentIds?: string[] // Добавляем список присутствовавших студентов
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
    timezone?: string
    currency?: string
    hasOAuthProvider?: boolean
    theme?: string
}

export const settingsApi = {
    get: () =>
        fetch('/api/settings').then(res => handleResponse<UserSettings>(res)),

    update: (data: Partial<UserSettings>) =>
        fetch('/api/settings', {
            method: 'PUT',
            headers,
            body: JSON.stringify(data),
        }).then(res => handleResponse<UserSettings>(res)),
}

export const statsApi = {
    get: () =>
        fetch('/api/stats').then(res => handleResponse<import('@/types').DashboardStats>(res)),
}
