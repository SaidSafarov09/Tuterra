import { useState } from 'react'
import { toast } from 'sonner'
import { Lesson } from '@/types'
import { lessonsApi } from '@/services/api'
import { LESSON_MESSAGES, GENERAL_MESSAGES } from '@/constants/messages'


export function useLessonActions(onUpdate?: () => void) {
    const [isLoading, setIsLoading] = useState(false)

    const togglePaid = async (lesson: Lesson) => {
        setIsLoading(true)
        try {
            await lessonsApi.update(lesson.id, { isPaid: !lesson.isPaid })
            toast.success(
                !lesson.isPaid ? LESSON_MESSAGES.MARKED_PAID : LESSON_MESSAGES.MARKED_UNPAID
            )
            onUpdate?.()
        } catch (error) {
            toast.error(LESSON_MESSAGES.PAYMENT_STATUS_ERROR)
        } finally {
            setIsLoading(false)
        }
    }

    const toggleCancel = async (lesson: Lesson) => {
        setIsLoading(true)
        try {
            await lessonsApi.update(lesson.id, { isCanceled: !lesson.isCanceled })
            toast.success(
                !lesson.isCanceled ? LESSON_MESSAGES.CANCELED : LESSON_MESSAGES.RESTORED
            )
            onUpdate?.()
        } catch (error) {
            toast.error(LESSON_MESSAGES.CANCEL_STATUS_ERROR)
        } finally {
            setIsLoading(false)
        }
    }

    const deleteLesson = async (lessonId: string) => {
        setIsLoading(true)
        try {
            await lessonsApi.delete(lessonId)
            toast.success(LESSON_MESSAGES.DELETED)
            onUpdate?.()
        } catch (error) {
            toast.error(LESSON_MESSAGES.DELETE_ERROR)
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
