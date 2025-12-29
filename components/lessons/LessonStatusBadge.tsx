import React from 'react'
import { getLessonStatus, getLessonStatusLabel, LessonStatus } from '@/lib/lessonUtils'
import styles from './LessonStatusBadge.module.scss'

interface LessonStatusBadgeProps {
    price: number
    isPaid: boolean
    className?: string
    paymentStatus?: 'paid' | 'unpaid' | 'partial'
    isStudentView?: boolean
}

export function LessonStatusBadge({
    price,
    isPaid,
    className = '',
    paymentStatus,
    isStudentView = false
}: LessonStatusBadgeProps) {
    const status: LessonStatus = paymentStatus || getLessonStatus(price, isPaid)
    const label = getLessonStatusLabel(status)

    const statusClass = status === 'unpaid' && isStudentView ? 'unpaidStudent' : status

    return (
        <span className={`${styles.badge} ${styles[statusClass]} ${className}`}>
            {label}
        </span>
    )
}
