'use client'

import React from 'react'
import { format, subMonths } from 'date-fns'
import { ru } from 'date-fns/locale'
import { ClockIcon } from '@/components/icons/Icons'
import { formatDuration } from '@/lib/dateUtils'
import styles from '../../app/(dashboard)/income/page.module.scss'

import { LockIcon } from '@/components/icons/Icons'
import { useAuthStore } from '@/store/auth'
import { formatCurrency } from '@/lib/formatUtils'

interface PrevMonthCardProps {
    date: Date
    income: number
    duration: number
    lessonsCount: number
    averageCheck: number
    isPro: boolean
    onUnlock: () => void
}

export const PrevMonthCard: React.FC<PrevMonthCardProps> = ({
    date,
    income,
    duration,
    lessonsCount,
    averageCheck,
    isPro,
    onUnlock
}) => {
    const { user } = useAuthStore()
    return (
        <div className={styles.statCard}>
            <div className={styles.statHeader}>
                <h3 className={styles.statTitle}>Предыдущий месяц</h3>
            </div>
            <div className={styles.statValue}>{formatCurrency(income, user?.currency)}</div>
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

            {isPro ? (
                <div className={styles.statDetails}>
                    <div className={styles.statDetailItem}>
                        <span className={styles.statDetailLabel}>Оплаченных занятий:</span>
                        <span className={styles.statDetailValue}>{lessonsCount}</span>
                    </div>
                    <div className={styles.statDetailItem}>
                        <span className={styles.statDetailLabel}>Средний чек:</span>
                        <span className={styles.statDetailValue}>
                            {averageCheck > 0 ? formatCurrency(averageCheck, user?.currency) : '—'}
                        </span>
                    </div>
                </div>
            ) : (
                <div className={styles.lockedStats} onClick={onUnlock}>
                    <LockIcon size={16} />
                    <span>Детальная статистика доступна в Pro</span>
                </div>
            )}
        </div>
    )
}
