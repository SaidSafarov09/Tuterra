'use client'

import React from 'react'
import { format, subMonths } from 'date-fns'
import { ru } from 'date-fns/locale'
import { ClockIcon } from '@/components/icons/Icons'
import { formatDuration } from '@/lib/dateUtils'
import styles from '../../app/(dashboard)/income/page.module.scss'

interface PrevMonthCardProps {
    date: Date
    income: number
    duration: number
    lessonsCount: number
    averageCheck: number
}

export const PrevMonthCard: React.FC<PrevMonthCardProps> = ({
    date,
    income,
    duration,
    lessonsCount,
    averageCheck
}) => {
    return (
        <div className={styles.statCard}>
            <div className={styles.statHeader}>
                <h3 className={styles.statTitle}>Предыдущий месяц</h3>
            </div>
            <div className={styles.statValue}>{income.toLocaleString()} ₽</div>
            <p className={styles.statDescription}>
                {format(subMonths(date, 1), 'LLLL yyyy', { locale: ru })}
            </p>

            <div className={styles.durationBlock}>
                <ClockIcon size={20} color="var(--primary)" />
                <div className={styles.durationText}>
                    Рабочие часы -
                    <strong>{formatDuration(duration)}</strong>
                </div>
            </div>

            <div className={styles.statDetails}>
                <div className={styles.statDetailItem}>
                    <span className={styles.statDetailLabel}>Оплаченных занятий:</span>
                    <span className={styles.statDetailValue}>{lessonsCount}</span>
                </div>
                <div className={styles.statDetailItem}>
                    <span className={styles.statDetailLabel}>Средний чек:</span>
                    <span className={styles.statDetailValue}>
                        {averageCheck > 0 ? `${averageCheck.toLocaleString()} ₽` : '—'}
                    </span>
                </div>
            </div>
        </div>
    )
}
