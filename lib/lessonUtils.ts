import type { Lesson, DayData, LessonPayment } from '@/types'

export type LessonStatus = 'free' | 'paid' | 'unpaid' | 'partial'

export function getLessonStatus(price: number, isPaid: boolean): LessonStatus {
    if (price === 0) return 'free'
    return isPaid ? 'paid' : 'unpaid'
}

/**
 * Определяет статус оплаты группового урока на основе посещаемости и оплаты
 * @param lessonPayments - массив платежей урока (lessonPayments содержит только присутствовавших студентов)
 * @returns 'paid' | 'partial' | 'unpaid'
 */
export function getGroupLessonPaymentStatus(lessonPayments: LessonPayment[]): 'paid' | 'partial' | 'unpaid' {
    if (!lessonPayments || lessonPayments.length === 0) {
        return 'unpaid' // Никто не пришел
    }

    const paidCount = lessonPayments.filter(p => p.hasPaid).length
    const totalAttended = lessonPayments.length

    if (paidCount === 0) {
        return 'unpaid' // Никто не оплатил
    } else if (paidCount === totalAttended) {
        return 'paid' // Все, кто пришли, оплатили
    } else {
        return 'partial' // Частично оплачено
    }
}

/**
 * Проверяет, является ли занятие групповым
 * @param lesson - занятие
 * @returns true если занятие групповое, false если индивидуальное
 */
export function isGroupLesson(lesson: Lesson): boolean {
    return !!lesson.group;
}

/**
 * Проверяет, полностью ли оплачено занятие (групповое или индивидуальное)
 * @param lesson - занятие
 * @returns true если занятие полностью оплачено, false в противном случае
 */
export function isFullyPaidLesson(lesson: Lesson): boolean {
    // Для индивидуальных занятий просто проверяем isPaid
    if (!lesson.group) {
        return lesson.isPaid;
    }

    // Для групповых занятий проверяем статус через lessonPayments
    return getGroupLessonPaymentStatus(lesson.lessonPayments || []) === 'paid';
}

export function isTrial(price: number): boolean {
    return price === 0
}

export function getLessonStatusLabel(status: LessonStatus): string {
    switch (status) {
        case 'free':
            return 'Бесплатный'
        case 'paid':
            return 'Оплачено'
        case 'unpaid':
            return 'Не оплачено'
        case 'partial':
            return 'Частично'
    }
}

export function getLessonStatusColor(status: LessonStatus): string {
    switch (status) {
        case 'free':
            return '#4A6CF7'
        case 'paid':
            return '#10B981'
        case 'unpaid':
            return '#EF4444'
        case 'partial':
            return '#F59E0B' // Yellow/orange for partial payment
    }
}

export function calculateDayEarnings(lessons: Array<{ price: number; isPaid: boolean }>): number {
    return lessons
        .filter(lesson => lesson.isPaid)
        .reduce((sum, lesson) => sum + lesson.price, 0)
}

export function calculateDayData(lessons: Lesson[], date: Date): DayData {
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)

    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    const dayLessons = lessons.filter(lesson => {
        const lessonDate = new Date(lesson.date)
        return lessonDate >= startOfDay && lessonDate <= endOfDay
    })

    const totalEarned = dayLessons.reduce((sum, lesson) => {
        if (lesson.group && lesson.lessonPayments) {
            // Учитываем только присутствовавших студентов (те, у кого есть запись в lessonPayments)
            const paidAttendedCount = lesson.lessonPayments.filter(p => p.hasPaid).length
            return sum + (paidAttendedCount * lesson.price)
        }
        return sum + (lesson.isPaid ? lesson.price : 0)
    }, 0)

    const potentialEarnings = dayLessons
        .filter(lesson => !lesson.isCanceled)
        .reduce((sum, lesson) => {
            if (lesson.group) {
                const payments = lesson.lessonPayments || []
                if (payments.length > 0) {
                    // Lesson started or finished: count only unpaid attendees
                    const paidCount = payments.filter(p => p.hasPaid).length
                    const unpaidCount = payments.length - paidCount
                    return sum + (unpaidCount * lesson.price)
                } else if (new Date(lesson.date) > new Date()) {
                    // Future lesson, no marks yet: assume full group potential
                    const studentCount = (lesson.group as any)._count?.students || (lesson.group as any).students?.length || 0
                    return sum + (studentCount * lesson.price)
                }
                return sum
            }
            return sum + (!lesson.isPaid ? lesson.price : 0)
        }, 0)

    return {
        lessons: dayLessons,
        totalEarned,
        potentialEarnings
    }
}

/**
 * Возвращает статус оплаты для занятия (включая групповые)
 * @param lesson - занятие
 * @returns статус оплаты: 'free', 'paid', 'unpaid', 'partial'
 */
export function getLessonPaymentStatus(lesson: Lesson): LessonStatus {
    if (lesson.price === 0) return 'free';

    if (lesson.group) {
        // Для группового занятия определяем статус на основе lessonPayments
        if (!lesson.lessonPayments || lesson.lessonPayments.length === 0) {
            return 'unpaid'; // Никто не пришёл
        }

        const attendedCount = lesson.lessonPayments.length;
        const paidCount = lesson.lessonPayments.filter(p => p.hasPaid).length;

        if (paidCount === 0) {
            return 'unpaid'; // Никто из пришедших не оплатил
        } else if (paidCount === attendedCount) {
            return 'paid'; // Все пришедшие оплатили
        } else {
            return 'partial'; // Частично оплачено
        }
    } else {
        // Для индивидуального занятия используем isPaid
        return lesson.isPaid ? 'paid' : 'unpaid';
    }
}
