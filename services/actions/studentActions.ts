import { toast } from 'sonner'
import { studentsApi } from '@/services/api'
import { STUDENT_MESSAGES, VALIDATION_MESSAGES } from '@/constants/messages'
import { Student } from '@/types'

/**
 * Получить ученика по ID
 */
export async function fetchStudent(studentId: string): Promise<Student | null> {
    try {
        return await studentsApi.getById(studentId)
    } catch (error) {
        toast.error(STUDENT_MESSAGES.NOT_FOUND)
        throw error
    }
}

/**
 * Получить всех учеников
 */
export async function fetchStudents(): Promise<Student[]> {
    try {
        return await studentsApi.getAll()
    } catch (error) {
        toast.error(STUDENT_MESSAGES.FETCH_ERROR)
        return []
    }
}

/**
 * Создать нового ученика
 */
export async function createStudent(data: {
    name: string
    contact?: string
    note?: string
    subjectId?: string
}): Promise<Student | null> {
    if (!data.name.trim()) {
        toast.error(VALIDATION_MESSAGES.ENTER_STUDENT_NAME)
        return null
    }

    try {
        const student = await studentsApi.create(data)
        toast.success(STUDENT_MESSAGES.CREATED)
        return student
    } catch (error: any) {
        const errorMessage = error.message || STUDENT_MESSAGES.CREATE_ERROR
        toast.error(errorMessage)
        return null
    }
}

/**
 * Обновить данные ученика
 */
export async function updateStudent(
    studentId: string,
    data: { name: string; contact?: string; note?: string }
): Promise<Student | null> {
    if (!data.name.trim()) {
        toast.error(VALIDATION_MESSAGES.ENTER_STUDENT_NAME)
        return null
    }

    try {
        const student = await studentsApi.update(studentId, data)
        toast.success(STUDENT_MESSAGES.UPDATED)
        return student
    } catch (error: any) {
        console.error('Update student error:', error)
        const errorMessage = error.message || STUDENT_MESSAGES.UPDATE_ERROR
        toast.error(errorMessage)
        return null
    }
}

/**
 * Удалить ученика
 */
export async function deleteStudent(studentId: string): Promise<boolean> {
    try {
        await studentsApi.delete(studentId)
        toast.success(STUDENT_MESSAGES.DELETED)
        return true
    } catch (error) {
        toast.error(STUDENT_MESSAGES.DELETE_ERROR)
        return false
    }
}
