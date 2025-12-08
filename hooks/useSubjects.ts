import { useState, useEffect } from 'react'
import { Subject } from '@/types'
import {
    fetchSubjects as loadSubjects,
    createSubject as createNewSubject,
    updateSubject as updateExistingSubject,
    deleteSubject as removeSubject,
} from '@/services/actions'

export function useSubjects() {
    const [subjects, setSubjects] = useState<Subject[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchSubjects = async () => {
        setIsLoading(true)
        const data = await loadSubjects()
        setSubjects(data)
        setError(data.length === 0 ? null : null)
        setIsLoading(false)
    }

    const createSubject = async (data: { name: string; color: string }) => {
        const subject = await createNewSubject(data)

        if (subject) {
            await fetchSubjects()
            return { success: true }
        }

        return { success: false }
    }

    const updateSubject = async (id: string, data: { name: string; color: string }) => {
        const subject = await updateExistingSubject(id, data)

        if (subject) {
            await fetchSubjects()
            return { success: true }
        }

        return { success: false }
    }

    const deleteSubject = async (id: string) => {
        const result = await removeSubject(id)

        if (result.success) {
            await fetchSubjects()
            return { success: true }
        }

        return { success: false }
    }

    useEffect(() => {
        fetchSubjects()
    }, [])

    return {
        subjects,
        isLoading,
        error,
        fetchSubjects,
        refetch: fetchSubjects, 
        createSubject,
        updateSubject,
        deleteSubject,
    }
}
