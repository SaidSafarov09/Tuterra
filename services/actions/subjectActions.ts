import { toast } from 'sonner'
import { subjectsApi } from '@/services/api'
import { SUBJECT_MESSAGES, STUDENT_MESSAGES, VALIDATION_MESSAGES, createSubjectCreatedMessage } from '@/constants/messages'
import { Subject } from '@/types'
import { deleteWithUndo } from '@/lib/undo'

export async function fetchSubject(subjectId: string): Promise<Subject | null> {
    try {
        return await subjectsApi.getById(subjectId)
    } catch (error) {
        toast.error(SUBJECT_MESSAGES.FETCH_ERROR)
        throw error
    }
}

export async function fetchSubjects(): Promise<Subject[]> {
    try {
        return await subjectsApi.getAll()
    } catch (error) {
        toast.error(SUBJECT_MESSAGES.FETCH_ERROR)
        return []
    }
}

export async function createSubject(data: {
    name: string
    color: string
}): Promise<Subject | null> {
    if (!data.name.trim()) {
        toast.error(VALIDATION_MESSAGES.ENTER_SUBJECT_NAME)
        return null
    }

    try {
        const subject = await subjectsApi.create(data)
        toast.success(createSubjectCreatedMessage(data.name))
        return subject
    } catch (error: any) {
        const message = error.message || SUBJECT_MESSAGES.CREATE_ERROR
        toast.error(message)
        return null
    }
}

export async function createSubjectWithRandomColor(name: string): Promise<Subject | null> {
    const colors = ['#4A6CF7', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316']
    const randomColor = colors[Math.floor(Math.random() * colors.length)]

    return createSubject({ name, color: randomColor })
}

export async function updateSubject(
    subjectId: string,
    data: { name: string; color: string }
): Promise<Subject | null> {
    if (!data.name.trim()) {
        toast.error(VALIDATION_MESSAGES.ENTER_SUBJECT_NAME)
        return null
    }

    try {
        const subject = await subjectsApi.update(subjectId, data)
        toast.success(SUBJECT_MESSAGES.UPDATED)
        return subject
    } catch (error) {
        toast.error(SUBJECT_MESSAGES.UPDATE_ERROR)
        return null
    }
}

export async function deleteSubject(subjectId: string): Promise<{
    success: boolean
    deletedLessonsCount?: number
}> {
    const result = await deleteWithUndo(
        async () => {
            try {
                const result = await subjectsApi.delete(subjectId)

                if (result.deletedLessonsCount && result.deletedLessonsCount > 0) {
                    toast.success(SUBJECT_MESSAGES.DELETED_WITH_LESSONS(result.deletedLessonsCount))
                } else {
                    toast.success(SUBJECT_MESSAGES.DELETED)
                }

                return result
            } catch (error) {
                toast.error(SUBJECT_MESSAGES.DELETE_ERROR)
                return { success: false }
            }
        },
        {
            message: 'Удаление предмета...'
        }
    )
    return result || { success: false }
}

export async function linkStudentToSubject(
    subjectId: string,
    studentId: string
): Promise<boolean> {
    if (!studentId || !subjectId) {
        toast.error(VALIDATION_MESSAGES.SELECT_STUDENT)
        return false
    }

    try {
        await subjectsApi.linkStudent(subjectId, studentId)
        toast.success(STUDENT_MESSAGES.LINKED_TO_SUBJECT)
        return true
    } catch (error: any) {
        const message = error.message || SUBJECT_MESSAGES.LINK_ERROR
        toast.error(message)
        return false
    }
}
export async function unlinkStudentFromSubject(
    subjectId: string,
    studentId: string
): Promise<boolean> {
    try {
        await subjectsApi.unlinkStudent(subjectId, studentId)
        toast.success(SUBJECT_MESSAGES.DELETED)
        return true
    } catch (error) {
        toast.error(SUBJECT_MESSAGES.DELETE_ERROR)
        return false
    }
}
