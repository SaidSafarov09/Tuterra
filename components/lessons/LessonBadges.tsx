import React from 'react'
import { LessonStatusBadge } from './LessonStatusBadge'
import { TrialBadge } from './TrialBadge'
import styles from './LessonBadges.module.scss'
import { LessonPayment } from '@/types'
import { getGroupLessonPaymentStatus } from '@/lib/lessonUtils'

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
    // For group lessons, determine payment status using utility function
    let paymentStatus: 'paid' | 'unpaid' | 'partial' = isPaid ? 'paid' : 'unpaid'

    if (isGroupLesson && lessonPayments) {
        paymentStatus = getGroupLessonPaymentStatus(lessonPayments)
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
