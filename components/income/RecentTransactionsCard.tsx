'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { HistoryIcon, UserIcon, ArrowRightIcon, UsersGroupIcon } from '@/components/icons/Icons'
import styles from '../../app/(dashboard)/income/page.module.scss'

interface Transaction {
    id: string
    slug?: string
    price: number
    group?: { name: string }
    groupName?: string
    student?: {
        name: string
        linkedUser?: {
            avatar?: string | null
        } | null
    }
    subject?: { name: string }
    subjectName?: string
}

interface RecentTransactionsCardProps {
    transactions: Transaction[]
    onViewAll: () => void
    isLocked?: boolean
}

export const RecentTransactionsCard: React.FC<RecentTransactionsCardProps> = ({
    transactions,
    onViewAll,
    isLocked
}) => {
    const router = useRouter()

    return (
        <div className={styles.statCard} style={isLocked ? { opacity: 0.7 } : {}}>
            <div className={styles.statHeader}>
                <h3 className={styles.statTitle}>Последние операции</h3>
                <HistoryIcon size={20} color="var(--text-secondary)" />
            </div>

            <div className={styles.transactionsList}>
                {transactions.length === 0 ? (
                    <p className={styles.emptyStateText} style={{ textAlign: 'center', padding: '20px 0' }}>
                        Операций не найдено
                    </p>
                ) : (
                    transactions.map((tx, i) => (
                        <div
                            key={tx.id || i}
                            className={styles.transactionItem}
                            onClick={() => {
                                if (isLocked) {
                                    onViewAll()
                                    return
                                }
                                router.push(`/lessons/${tx.slug || tx.id}`)
                            }}
                            style={{ cursor: 'pointer' }}
                        >
                            <div className={styles.transactionInfo}>
                                <div className={styles.transactionIcon}>
                                    {tx.group ? (
                                        <UsersGroupIcon size={20} />
                                    ) : tx.student?.linkedUser?.avatar ? (
                                        <img src={tx.student.linkedUser.avatar} alt="" className={styles.transactionAvatar} />
                                    ) : (
                                        <UserIcon size={20} />
                                    )}
                                </div>
                                <div className={styles.transactionDetails}>
                                    <span className={styles.transactionStudent}>
                                        {tx.group ? tx.group.name : tx.groupName ? tx.groupName : tx.student?.name}
                                    </span>
                                    <span className={styles.transactionSubject}>
                                        {tx.subject?.name || tx.subjectName || 'Без предмета'}
                                    </span>
                                </div>
                            </div>
                            <span
                                className={styles.transactionAmount}
                                style={Number(tx.price) === 0 ? { color: 'var(--primary)' } : {}}
                            >
                                {Number(tx.price) === 0 ? 'Бесплатно' : `+${tx.price} ₽`}
                            </span>
                        </div>
                    ))
                )}
            </div>

            <button
                className={styles.allTransactionsLink}
                onClick={onViewAll}
                style={{
                    background: 'none',
                    border: 'none',
                    borderTop: '1px solid var(--border-light)',
                    width: '100%',
                    cursor: 'pointer'
                }}
            >
                Все операции
                <ArrowRightIcon size={16} />
            </button>
        </div>
    )
}
