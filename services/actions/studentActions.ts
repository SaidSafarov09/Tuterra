import { toast } from 'sonner'
import { studentsApi } from '@/services/api'
import { STUDENT_MESSAGES, VALIDATION_MESSAGES } from '@/constants/messages'
import { Student } from '@/types'
import { ContactType } from '@/lib/contactUtils'

export async function fetchStudent(studentId: string): Promise<Student | null> {
    try {
        return await studentsApi.getById(studentId)
    } catch (error) {
        toast.error(STUDENT_MESSAGES.NOT_FOUND)
        throw error
    }
}

export async function fetchStudents(): Promise<Student[]> {
    try {
        return await studentsApi.getAll()
    } catch (error) {
        toast.error(STUDENT_MESSAGES.FETCH_ERROR)
        return []
    }
}

export async function createStudent(data: {
    name: string
    contact?: string
    contactType?: ContactType
    parentContact?: string
    parentContactType?: ContactType
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

export async function updateStudent(
    studentId: string,
    data: {
        name: string
        contact?: string
        contactType?: ContactType
        parentContact?: string
        parentContactType?: ContactType
        note?: string
    }
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

export async function unlinkStudentFromSubjectWithLessonsNotification(
    subjectId: string,
    studentId: string,
    subjectName: string,
    studentLessons: any[] = []
): Promise<boolean> {
    try {
        const lessonsToDelete = studentLessons.filter(lesson =>
            lesson.subject?.id === subjectId && new Date(lesson.date) >= new Date()
        )
        const response = await fetch(`/api/subjects/${subjectId}/students/link`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ studentId }),
        })

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'An error occurred' }))
            throw new Error(error.message || error.error || 'Failed to unlink student from subject')
        }
        toast.success(`Предмет "${subjectName}" удален у ученика`)
 
        if (lessonsToDelete.length > 0) {
            const lessonTimes = lessonsToDelete
                .map(lesson => new Date(lesson.date))
                .sort((a, b) => a.getTime() - b.getTime())
                .map(date => `• ${date.toLocaleDateString('ru-RU')} в ${date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`)
                .join('\n')
            
            toast.info(
                `Будущие занятия по этому предмету были автоматически удалены:\n${lessonTimes}`,
                {
                    duration: 8000,
                    position: 'bottom-center'
                }
            )
        }
        
        return true
    } catch (error: any) {
        console.error('Unlink student from subject error:', error)
        toast.error(error.message || STUDENT_MESSAGES.UNLINKED_FROM_SUBJECT)
        return false
    }
}
