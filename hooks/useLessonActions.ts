import { useState } from 'react'
import { toast } from 'sonner'
import { Lesson } from '@/types'
import {
    toggleLessonPaid,
    toggleLessonCanceled,
    deleteLesson as removeLesson,
    updateLesson,
} from '@/services/actions'

export function useLessonActions(onUpdate?: () => void, isStudent = false) {
    const [isLoading, setIsLoading] = useState(false)
    const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false)
    const [reschedulingLesson, setReschedulingLesson] = useState<Lesson | null>(null)
    const [isGroupPaymentModalOpen, setIsGroupPaymentModalOpen] = useState(false)
    const [paymentLesson, setPaymentLesson] = useState<Lesson | null>(null)

    const togglePaid = async (lesson: Lesson) => {
        if (lesson.group) {
            setPaymentLesson(lesson)
            setIsGroupPaymentModalOpen(true)
            return
        }

        setIsLoading(true)
        const updated = await toggleLessonPaid(lesson.id, !lesson.isPaid)

        if (updated) {
            onUpdate?.()
        }

        setIsLoading(false)
    }

    const toggleCancel = async (lesson: Lesson) => {
        if (isStudent) {
            setIsLoading(true)
            try {
                const response = await fetch(`/api/student/lessons/${lesson.id}/request`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ type: 'cancel' })
                })
                if (!response.ok) throw new Error()
                toast.success('Запрос на отмену отправлен преподавателю')
                onUpdate?.()
            } catch (error) {
                toast.error('Не удалось отправить запрос')
            } finally {
                setIsLoading(false)
            }
            return
        }

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

    const handleRescheduleLesson = (lesson: Lesson) => {
        setReschedulingLesson(lesson)
        setIsRescheduleModalOpen(true)
    }

    const handleConfirmReschedule = async (newDate: Date) => {
        if (!reschedulingLesson) return

        if (isStudent) {
            setIsLoading(true)
            try {
                const response = await fetch(`/api/student/lessons/${reschedulingLesson.id}/request`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ type: 'reschedule', newDate: newDate.toISOString() })
                })
                if (!response.ok) throw new Error()
                toast.success('Запрос на перенос отправлен преподавателю')
                setIsRescheduleModalOpen(false)
                setReschedulingLesson(null)
                onUpdate?.()
            } catch (error) {
                toast.error('Не удалось отправить запрос')
            } finally {
                setIsLoading(false)
            }
            return
        }

        setIsLoading(true)
        const updated = await updateLesson(reschedulingLesson.id, {
            studentId: reschedulingLesson.student?.id || undefined,
            groupId: reschedulingLesson.group?.id || undefined,
            subjectId: reschedulingLesson.subject?.id || '',
            date: newDate,
            price: reschedulingLesson.price.toString(),
            isPaid: reschedulingLesson.isPaid,
            topic: reschedulingLesson.topic || '',
            notes: reschedulingLesson.notes || '',
            duration: reschedulingLesson.duration || 60,
        })

        if (updated) {
            setIsRescheduleModalOpen(false)
            setReschedulingLesson(null)
            onUpdate?.()
        }
        setIsLoading(false)
    }

    return {
        togglePaid,
        toggleCancel,
        deleteLesson,
        handleRescheduleLesson,
        handleConfirmReschedule,
        isLoading,
        isRescheduleModalOpen,
        setIsRescheduleModalOpen,
        reschedulingLesson,
        isGroupPaymentModalOpen,
        setIsGroupPaymentModalOpen,
        paymentLesson,
        paymentLessonDate: paymentLesson?.date,
    }
}
