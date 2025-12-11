import React from 'react'
import { getLessonStatus, getLessonStatusLabel, LessonStatus } from '@/lib/lessonUtils'
import styles from './LessonStatusBadge.module.scss'

interface LessonStatusBadgeProps {
    price: number
    isPaid: boolean
    className?: string
    paymentStatus?: 'paid' | 'unpaid' | 'partial'
}

export function LessonStatusBadge({
    price,
    isPaid,
    className = '',
    paymentStatus
}: LessonStatusBadgeProps) {
    const status: LessonStatus = paymentStatus || getLessonStatus(price, isPaid)
    const label = getLessonStatusLabel(status)

    return (
        <span className={`${styles.badge} ${styles[status]} ${className}`}>
            {label}
        </span>
    )
}
