import { toast } from 'sonner'
import { lessonsApi } from '@/services/api'
import { LESSON_MESSAGES, VALIDATION_MESSAGES } from '@/constants/messages'
import { Lesson } from '@/types'
import { deleteWithUndo } from '@/lib/undo'

export async function fetchLesson(lessonId: string): Promise<Lesson | null> {
    try {
        return await lessonsApi.getById(lessonId)
    } catch (error) {
        toast.error(LESSON_MESSAGES.FETCH_ERROR)
        throw error
    }
}

export async function fetchLessons(filter?: string): Promise<Lesson[]> {
    try {
        return await lessonsApi.getAll(filter)
    } catch (error) {
        toast.error(LESSON_MESSAGES.FETCH_ERROR)
        return []
    }
}

export async function createLesson(data: {
    studentId?: string
    groupId?: string
    subjectId: string
    date: Date | string
    duration?: number
    isTrial?: boolean
    price: number | string
    isPaid?: boolean
    topic?: string
    notes?: string
    paidStudentIds?: string[]
    planTopicId?: string | null
    recurrence?: any
    seriesPrice?: number | string
    isPaidAll?: boolean
}): Promise<Lesson | null> {
    if (data.price === undefined || data.price === '') {
        toast.error(VALIDATION_MESSAGES.ENTER_PRICE)
        return null
    }

    const lessonDate = typeof data.date === 'string' ? new Date(data.date) : data.date
    // Allow past dates for manual entry if needed, but usually we warn
    // Removed strict past date check to match other creation points

    try {
        const lesson = await lessonsApi.create({
            studentId: data.studentId,
            groupId: data.groupId,
            subjectId: data.subjectId,
            date: lessonDate.toISOString(),
            duration: data.duration,
            isTrial: data.isTrial,
            price: Number(data.price),
            isPaid: data.isPaid || false,
            topic: data.topic,
            notes: data.notes,
            paidStudentIds: data.paidStudentIds,
            planTopicId: data.planTopicId,
            recurrence: data.recurrence,
            seriesPrice: data.seriesPrice ? Number(data.seriesPrice) : undefined,
            isPaidAll: data.isPaidAll
        })
        toast.success(LESSON_MESSAGES.CREATED)
        return lesson
    } catch (error) {
        toast.error(LESSON_MESSAGES.CREATE_ERROR)
        return null
    }
}

export async function updateLesson(
    lessonId: string,
    data: Partial<{
        studentId: string
        groupId: string
        subjectId: string
        date: Date | string
        duration: number
        isTrial: boolean
        price: number | string
        isPaid: boolean
        isCanceled: boolean
        topic: string
        notes: string
        paidStudentIds: string[]
        attendedStudentIds: string[]
        planTopicId: string | null
        recurrence: any
        seriesPrice: number | string
        isPaidAll: boolean
    }>,
    options?: { showToast?: boolean }
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

        if (data.duration !== undefined) {
            updateData.duration = data.duration
        }

        if (data.isTrial !== undefined) {
            updateData.isTrial = data.isTrial
        }

        if (data.recurrence !== undefined) {
            updateData.recurrence = data.recurrence
        }

        if (data.seriesPrice !== undefined) {
            updateData.seriesPrice = Number(data.seriesPrice)
        }

        if (data.isPaidAll !== undefined) {
            updateData.isPaidAll = data.isPaidAll
        }

        const lesson = await lessonsApi.update(lessonId, updateData)
        if (options?.showToast !== false) {
            toast.success(LESSON_MESSAGES.UPDATED)
        }
        return lesson
    } catch (error: any) {
        const errorMessage = error?.message || LESSON_MESSAGES.UPDATE_ERROR
        if (options?.showToast !== false) {
            toast.error(errorMessage)
        }
        return null
    }
}

export async function deleteLesson(lessonId: string): Promise<boolean> {
    const result = await deleteWithUndo(
        async () => {
            try {
                await lessonsApi.delete(lessonId)
                toast.success(LESSON_MESSAGES.DELETED)
                return true
            } catch (error) {
                toast.error(LESSON_MESSAGES.DELETE_ERROR)
                return false
            }
        },
        {
            message: 'Удаление занятия...'
        }
    )
    return !!result
}

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
