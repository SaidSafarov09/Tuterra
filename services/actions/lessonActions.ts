import { toast } from 'sonner'
import { lessonsApi } from '@/services/api'
import { LESSON_MESSAGES, VALIDATION_MESSAGES } from '@/constants/messages'
import { Lesson } from '@/types'

/**
 * Получить занятие по ID
 */
export async function fetchLesson(lessonId: string): Promise<Lesson | null> {
    try {
        return await lessonsApi.getById(lessonId)
    } catch (error) {
        toast.error(LESSON_MESSAGES.FETCH_ERROR)
        throw error
    }
}

/**
 * Получить занятия с фильтром
 */
export async function fetchLessons(filter?: string): Promise<Lesson[]> {
    try {
        return await lessonsApi.getAll(filter)
    } catch (error) {
        toast.error(LESSON_MESSAGES.FETCH_ERROR)
        return []
    }
}

/**
 * Создать новое занятие
 */
export async function createLesson(data: {
    studentId: string
    subjectId: string
    date: Date | string
    price: number | string
    isPaid: boolean
    topic?: string
    notes?: string
}): Promise<Lesson | null> {
    if (!data.price) {
        toast.error(VALIDATION_MESSAGES.ENTER_PRICE)
        return null
    }

    const lessonDate = typeof data.date === 'string' ? new Date(data.date) : data.date
    if (lessonDate < new Date()) {
        toast.error(VALIDATION_MESSAGES.PAST_DATE)
        return null
    }

    try {
        const lesson = await lessonsApi.create({
            studentId: data.studentId,
            subjectId: data.subjectId,
            date: lessonDate.toISOString(),
            price: Number(data.price),
            isPaid: data.isPaid,
            topic: data.topic,
            notes: data.notes,
        })
        toast.success(LESSON_MESSAGES.CREATED)
        return lesson
    } catch (error) {
        toast.error(LESSON_MESSAGES.CREATE_ERROR)
        return null
    }
}

/**
 * Обновить занятие
 */
export async function updateLesson(
    lessonId: string,
    data: Partial<{
        studentId: string
        subjectId: string
        date: Date | string
        price: number | string
        isPaid: boolean
        isCanceled: boolean
        topic: string
        notes: string
    }>
): Promise<Lesson | null> {
    try {
        const updateData: any = { ...data }

        if (data.date) {
            updateData.date = typeof data.date === 'string'
                ? data.date
                : data.date.toISOString()
        }

        if (data.price !== undefined) {
            updateData.price = Number(data.price)
        }

        const lesson = await lessonsApi.update(lessonId, updateData)
        toast.success(LESSON_MESSAGES.UPDATED)
        return lesson
    } catch (error) {
        toast.error(LESSON_MESSAGES.UPDATE_ERROR)
        return null
    }
}

/**
 * Удалить занятие
 */
export async function deleteLesson(lessonId: string): Promise<boolean> {
    try {
        await lessonsApi.delete(lessonId)
        toast.success(LESSON_MESSAGES.DELETED)
        return true
    } catch (error) {
        toast.error(LESSON_MESSAGES.DELETE_ERROR)
        return false
    }
}

/**
 * Переключить статус оплаты
 */
export async function toggleLessonPaid(
    lessonId: string,
    isPaid: boolean
): Promise<Lesson | null> {
    try {
        const lesson = await lessonsApi.update(lessonId, { isPaid })
        toast.success(isPaid ? LESSON_MESSAGES.PAID : LESSON_MESSAGES.UNPAID)
        return lesson
    } catch (error) {
        toast.error(LESSON_MESSAGES.PAYMENT_STATUS_ERROR)
        return null
    }
}

/**
 * Переключить статус отмены
 */
export async function toggleLessonCanceled(
    lessonId: string,
    isCanceled: boolean
): Promise<Lesson | null> {
    try {
        const lesson = await lessonsApi.update(lessonId, { isCanceled })
        toast.success(isCanceled ? LESSON_MESSAGES.CANCELED : LESSON_MESSAGES.RESTORED)
        return lesson
    } catch (error) {
        toast.error(LESSON_MESSAGES.CANCEL_STATUS_ERROR)
        return null
    }
}
