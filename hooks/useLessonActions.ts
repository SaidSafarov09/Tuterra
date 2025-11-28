import { useState } from 'react'
import { toast } from 'sonner'
import { Lesson } from '@/types'

/**
 * Hook for managing lesson operations (toggle paid, cancel, delete)
 */
export function useLessonActions(onUpdate?: () => void) {
    const [isLoading, setIsLoading] = useState(false)

    const togglePaid = async (lesson: Lesson) => {
        setIsLoading(true)
        try {
            const response = await fetch(`/api/lessons/${lesson.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isPaid: !lesson.isPaid }),
            })

            if (response.ok) {
                toast.success(
                    !lesson.isPaid ? 'Отмечено как оплаченное' : 'Отмечено как неоплаченное'
                )
                onUpdate?.()
            } else {
                toast.error('Не удалось обновить статус оплаты')
            }
        } catch (error) {
            toast.error('Произошла ошибка')
        } finally {
            setIsLoading(false)
        }
    }

    const toggleCancel = async (lesson: Lesson) => {
        setIsLoading(true)
        try {
            const response = await fetch(`/api/lessons/${lesson.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isCanceled: !lesson.isCanceled }),
            })

            if (response.ok) {
                toast.success(
                    !lesson.isCanceled ? 'Занятие отменено' : 'Занятие восстановлено'
                )
                onUpdate?.()
            } else {
                toast.error('Не удалось обновить статус')
            }
        } catch (error) {
            toast.error('Произошла ошибка')
        } finally {
            setIsLoading(false)
        }
    }

    const deleteLesson = async (lessonId: string) => {
        setIsLoading(true)
        try {
            const response = await fetch(`/api/lessons/${lessonId}`, {
                method: 'DELETE',
            })

            if (response.ok) {
                toast.success('Занятие удалено')
                onUpdate?.()
            } else {
                toast.error('Не удалось удалить занятие')
            }
        } catch (error) {
            toast.error('Произошла ошибка при удалении')
        } finally {
            setIsLoading(false)
        }
    }

    return {
        togglePaid,
        toggleCancel,
        deleteLesson,
        isLoading,
    }
}
