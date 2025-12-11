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

    if (isGroupLesson && totalStudents > 0 && lessonPayments.length > 0) {
        const paidCount = lessonPayments.filter(p => p.hasPaid).length

        if (paidCount === 0) {
            paymentStatus = 'unpaid'
        } else if (paidCount === totalStudents) {
            paymentStatus = 'paid'
        } else {
            paymentStatus = 'partial'
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
