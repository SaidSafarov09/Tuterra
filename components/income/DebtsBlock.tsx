'use client'

import React from 'react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { useRouter } from 'next/navigation'
import { AlertIcon } from '@/components/icons/Icons'
import styles from './DebtsBlock.module.scss'
import { useAuthStore } from '@/store/auth'
import { formatCurrency } from '@/lib/formatUtils'

interface Debt {
    id: string
    lessonId: string
    slug?: string
    studentName: string
    amount: number
    date: string
    isGroup: boolean
    groupName?: string
    subject?: {
        name: string
        color: string
    }
}

interface DebtsBlockProps {
    debts: Debt[]
}

export const DebtsBlock: React.FC<DebtsBlockProps> = ({ debts }) => {
    const router = useRouter()
    const { user } = useAuthStore()

    if (!debts || debts.length === 0) return null

    return (
        <div className={styles.debtsContainer}>
            <h2 className={styles.title}>
                Долги <span>{debts.length}</span>
            </h2>
            <div className={styles.debtsGrid}>
                {debts.map((debt) => (
                    <div
                        key={debt.id}
                        className={styles.debtCard}
                        onClick={() => router.push(`/lessons/${debt.slug || debt.lessonId}`)}
                    >
                        <div className={styles.mainInfo}>
                            <span className={styles.studentName}>{debt.studentName}</span>
                            <div className={styles.lessonInfo}>
                                {format(new Date(debt.date), 'd MMMM, HH:mm', { locale: ru })}
                                {debt.isGroup && (
                                    <span className={styles.groupBadge}>Группа: {debt.groupName}</span>
                                )}
                            </div>
                        </div>
                        <div
                            className={styles.amount}
                        >
                            {Number(debt.amount) === 0 ? (
                                <span style={{ color: 'var(--primary)' }}>Бесплатно</span>
                            ) : (
                                formatCurrency(debt.amount, user?.currency)
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
