'use client'

import React from 'react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { ClockIcon } from '@/components/icons/Icons'
import { formatDuration } from '@/lib/dateUtils'
import styles from '../../app/(dashboard)/income/page.module.scss'

import { LockIcon } from '@/components/icons/Icons'
import { useAuthStore } from '@/store/auth'
import { formatCurrency } from '@/lib/formatUtils'

interface CurrentMonthCardProps {
    date: Date
    income: number
    previousIncome: number
    duration: number
    lessonsCount: number
    averageCheck: number
    percentageChange: number
    isGrowth: boolean
    isPro: boolean
    onUnlock: () => void
}

export const CurrentMonthCard: React.FC<CurrentMonthCardProps> = ({
    date,
    income,
    previousIncome,
    duration,
    lessonsCount,
    averageCheck,
    percentageChange,
    isGrowth,
    isPro,
    onUnlock
}) => {
    const { user } = useAuthStore()
    return (
        <div className={styles.statCard}>
            <div className={styles.statHeader}>
                <h3 className={styles.statTitle}>Доход за месяц</h3>
                {isPro && previousIncome > 0 && (
                    <div className={`${styles.badge} ${isGrowth ? styles.badgeSuccess : styles.badgeDanger}`}>
                        {isGrowth ? '↑' : '↓'} {Math.abs(percentageChange).toFixed(1)}%
                    </div>
                )}
            </div>
            <div className={styles.statValue}>{formatCurrency(income, user?.currency)}</div>
            <p className={styles.statDescription}>
                Итого заработано за {format(date, 'LLLL yyyy', { locale: ru })}
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
                    {previousIncome > 0 && (
                        <div className={styles.statDetailItem}>
                            <span className={styles.statDetailLabel}>
                                {isGrowth ? 'Рост' : 'Снижение'}:
                            </span>
                            <span className={`${styles.statDetailValue} ${isGrowth ? styles.growthValue : styles.declineValue}`}>
                                {isGrowth ? '+' : '-'}{formatCurrency(Math.abs(income - previousIncome), user?.currency)}
                            </span>
                        </div>
                    )}
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
