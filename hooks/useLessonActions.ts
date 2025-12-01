import { useState } from 'react'
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

    const deleteLesson = async (lessonId: string) => {
        setIsLoading(true)
        const success = await removeLesson(lessonId)

        if (success) {
            onUpdate?.()
        }

        setIsLoading(false)
    }

    return {
        togglePaid,
        toggleCancel,
        deleteLesson,
        isLoading,
    }
}
