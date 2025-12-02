import React from 'react'
import { getLessonStatus, getLessonStatusLabel } from '@/lib/lessonUtils'
import styles from './LessonStatusBadge.module.scss'

interface LessonStatusBadgeProps {
    price: number
    isPaid: boolean
    className?: string
}

export function LessonStatusBadge({ price, isPaid, className = '' }: LessonStatusBadgeProps) {
    const status = getLessonStatus(price, isPaid)
    const label = getLessonStatusLabel(status)

    return (
        <span className={`${styles.badge} ${styles[status]} ${className}`}>
            {label}
        </span>
    )
}
