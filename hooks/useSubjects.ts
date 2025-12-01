import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Subject } from '@/types'

export function useSubjects() {
    const [subjects, setSubjects] = useState<Subject[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchSubjects = async () => {
        try {
            const response = await fetch('/api/subjects')
            if (response.ok) {
                const data = await response.json()
                setSubjects(data)
                setError(null)
            } else {
                const errorMessage = 'Не удалось загрузить предметы'
                setError(errorMessage)
                toast.error(errorMessage)
            }
        } catch (err) {
            const errorMessage = 'Произошла ошибка при загрузке предметов'
            setError(errorMessage)
            toast.error(errorMessage)
        } finally {
            setIsLoading(false)
        }
    }

    const createSubject = async (data: { name: string; color: string }) => {
        try {
            const response = await fetch('/api/subjects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            })

            if (response.ok) {
                await fetchSubjects()
                toast.success('Предмет успешно добавлен')
                return { success: true }
            } else {
                const result = await response.json()
                toast.error(result.error || 'Произошла ошибка')
                return { success: false, error: result.error }
            }
        } catch (err) {
            toast.error('Произошла ошибка при создании предмета')
            return { success: false, error: 'Произошла ошибка при создании предмета' }
        }
    }

    const updateSubject = async (id: string, data: { name: string; color: string }) => {
        try {
            const response = await fetch(`/api/subjects/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            })

            if (response.ok) {
                await fetchSubjects()
                toast.success('Предмет обновлён')
                return { success: true }
            } else {
                toast.error('Не удалось обновить предмет')
                return { success: false }
            }
        } catch (err) {
            toast.error('Произошла ошибка')
            return { success: false }
        }
    }

    const deleteSubject = async (id: string) => {
        try {
            const response = await fetch(`/api/subjects/${id}`, {
                method: 'DELETE',
            })

            if (response.ok) {
                const data = await response.json()
                await fetchSubjects()

                if (data.deletedLessonsCount > 0) {
                    toast.success(
                        `Предмет успешно удалён. Также удалено занятий: ${data.deletedLessonsCount}`,
                        { duration: 4000 }
                    )
                } else {
                    toast.success('Предмет успешно удалён')
                }
                return { success: true }
            } else {
                toast.error('Не удалось удалить предмет')
                return { success: false }
            }
        } catch (err) {
            toast.error('Произошла ошибка при удалении')
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
