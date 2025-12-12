import React from 'react'
import { LessonStatusBadge } from './LessonStatusBadge'
import { TrialBadge } from './TrialBadge'
import styles from './LessonBadges.module.scss'
import { LessonPayment } from '@/types'

interface LessonBadgesProps {
    price: number
    isPaid: boolean
    isTrial?: boolean
    isGroupLesson?: boolean
    totalStudents?: number
    lessonPayments?: LessonPayment[]
}

export function LessonBadges({
    price,
    isPaid,
    isTrial,
    isGroupLesson = false,
    totalStudents = 0,
    lessonPayments = []
}: LessonBadgesProps) {
    // For group lessons, determine payment status
    let paymentStatus: 'paid' | 'unpaid' | 'partial' = isPaid ? 'paid' : 'unpaid'

    if (isGroupLesson && lessonPayments && lessonPayments.length > 0) {
        // Рассчитываем статус оплаты только на основе присутствовавших студентов
        const attendedPayments = lessonPayments.filter(p => p.hasPaid || !p.hasPaid) // Все, кто присутствовал (оплатил или не оплатил)
        const totalAttended = attendedPayments.length
        const paidAttended = attendedPayments.filter(p => p.hasPaid).length

        if (totalAttended === 0) {
            paymentStatus = 'unpaid'
        } else if (paidAttended === 0) {
            paymentStatus = 'unpaid'
        } else if (paidAttended === totalAttended) {
            paymentStatus = 'paid' // Все присутствовавшие оплатили
        } else {
            paymentStatus = 'partial' // Только часть присутствовавших оплатила
        }
    }

    return (
        <div className={styles.badges}>
            {isTrial && <TrialBadge />}
            <LessonStatusBadge
                price={price}
                isPaid={paymentStatus === 'paid'}
                paymentStatus={paymentStatus}
            />
        </div>
    )
}
