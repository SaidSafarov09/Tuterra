import { useState } from 'react'
import { toast } from 'sonner'
import { Lesson } from '@/types'
import {
    toggleLessonPaid,
    toggleLessonCanceled,
    deleteLesson as removeLesson,
} from '@/services/actions'

export function useLessonActions(onUpdate?: () => void) {
    const [isLoading, setIsLoading] = useState(false)

    const togglePaid = async (lesson: Lesson) => {
        setIsLoading(true)
        const updated = await toggleLessonPaid(lesson.id, !lesson.isPaid)

        if (updated) {
            onUpdate?.()
        }

        setIsLoading(false)
    }

    const toggleCancel = async (lesson: Lesson) => {
        setIsLoading(true)
        const updated = await toggleLessonCanceled(lesson.id, !lesson.isCanceled)

        if (updated) {
            onUpdate?.()
        }

        setIsLoading(false)
    }

    const deleteLesson = async (lessonId: string, scope: 'single' | 'series' = 'single') => {
        setIsLoading(true)
        try {
            const response = await fetch(`/api/lessons/${lessonId}?scope=${scope}`, {
                method: 'DELETE',
            })

            if (!response.ok) {
                throw new Error('Failed to delete lesson')
            }

            toast.success(scope === 'series' ? 'Серия занятий удалена' : 'Занятие удалено')
            if (onUpdate) onUpdate() 
        } catch (error) {
            toast.error('Не удалось удалить занятие')
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

