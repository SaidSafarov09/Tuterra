import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Subject } from '@/types'
import { subjectsApi } from '@/services/api'
import { SUBJECT_MESSAGES } from '@/constants/messages'

export function useSubjects() {
    const [subjects, setSubjects] = useState<Subject[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchSubjects = async () => {
        try {
            const data = await subjectsApi.getAll()
            setSubjects(data)
            setError(null)
        } catch (err: any) {
            const errorMessage = SUBJECT_MESSAGES.FETCH_ERROR
            setError(errorMessage)
            toast.error(errorMessage)
        } finally {
            setIsLoading(false)
        }
    }

    const createSubject = async (data: { name: string; color: string }) => {
        try {
            await subjectsApi.create(data)
            await fetchSubjects()
            toast.success(SUBJECT_MESSAGES.CREATED)
            return { success: true }
        } catch (err: any) {
            const errorMessage = err.message || SUBJECT_MESSAGES.CREATE_ERROR
            toast.error(errorMessage)
            return { success: false, error: errorMessage }
        }
    }

    const updateSubject = async (id: string, data: { name: string; color: string }) => {
        try {
            await subjectsApi.update(id, data)
            await fetchSubjects()
            toast.success(SUBJECT_MESSAGES.UPDATED)
            return { success: true }
        } catch (err) {
            toast.error(SUBJECT_MESSAGES.UPDATE_ERROR)
            return { success: false }
        }
    }

    const deleteSubject = async (id: string) => {
        try {
            const data = await subjectsApi.delete(id)
            await fetchSubjects()

            if (data.deletedLessonsCount && data.deletedLessonsCount > 0) {
                toast.success(SUBJECT_MESSAGES.DELETED_WITH_LESSONS(data.deletedLessonsCount), { duration: 4000 })
            } else {
                toast.success(SUBJECT_MESSAGES.DELETED)
            }
            return { success: true }
        } catch (err) {
            toast.error(SUBJECT_MESSAGES.DELETE_ERROR)
            return { success: false }
        }
    }

    useEffect(() => {
        fetchSubjects()
    }, [])

    return {
        subjects,
        isLoading,
        error,
        refetch: fetchSubjects,
        createSubject,
        updateSubject,
        deleteSubject,
    }
}
