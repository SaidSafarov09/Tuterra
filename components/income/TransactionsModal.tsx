'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { format, subMonths } from 'date-fns'
import { useRouter } from 'next/navigation'
import { ru } from 'date-fns/locale'
import { Modal } from '@/components/ui/Modal'
import { UserIcon, UsersGroupIcon } from '@/components/icons/Icons'
import { Dropdown } from '@/components/ui/Dropdown'
import { incomeApi } from '@/services/api'
import { toast } from 'sonner'
import { AnimatePresence, motion } from 'framer-motion'
import styles from './TransactionsModal.module.scss'

interface TransactionsModalProps {
    isOpen: boolean
    onClose: () => void
    initialMonth?: Date
}

const TransactionItem = ({ tx, onClose, router }: { tx: any, onClose: () => void, router: any }) => {
    const [isExpanded, setIsExpanded] = useState(false)
    const hasParticipants = tx.group && tx.lessonPayments && tx.lessonPayments.length > 0
    const visibleParticipants = isExpanded ? tx.lessonPayments : tx.lessonPayments?.slice(0, 3)
    const hasMore = tx.lessonPayments?.length > 3

    const now = new Date()
    const lessonEnd = new Date(new Date(tx.date).getTime() + (tx.duration || 60) * 60000)
    const isFutureOrOngoing = now < lessonEnd

    return (
        <div
            className={styles.transactionItem}
            onClick={() => {
                onClose()
                router.push(`/lessons/${tx.slug || tx.id}`)
            }}
        >
            <div className={styles.mainRow}>
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
                        <span className={styles.transactionDate}>
                            {format(new Date(tx.date), 'd MMMM yyyy', { locale: ru })}
                        </span>
                    </div>
                </div>
                <span className={styles.transactionAmount}>+{tx.price} ₽</span>
            </div>

            {hasParticipants && (
                <div className={styles.participantsList} onClick={(e) => e.stopPropagation()}>
                    {visibleParticipants.map((p: any, idx: number) => {
                        // Refined logic
                        const getParticipantStatus = () => {
                            if (p.hasPaid) return { nameClass: '', dotClass: styles.paid, label: null }
                            if (isFutureOrOngoing) return { nameClass: styles.pending, dotClass: styles.pending, label: 'Не оплачено' }
                            return { nameClass: styles.debtor, dotClass: '', label: 'Долг' }
                        }

                        const status = getParticipantStatus()

                        return (
                            <div key={p.id || idx} className={styles.participantItem}>
                                <div className={`${styles.participantName} ${status.nameClass}`}>
                                    <div className={`${styles.statusDot} ${status.dotClass}`} />
                                    {p.student?.name || 'Ученик'}
                                </div>
                                {p.hasPaid ? (
                                    <span className={styles.participantAmount}>
                                        +{tx.price / (tx.lessonPayments?.filter((lp: any) => lp.hasPaid).length || 1)} ₽
                                    </span>
                                ) : (
                                    <span className={isFutureOrOngoing ? styles.pendingLabel : styles.debtLabel}>
                                        {status.label}
                                    </span>
                                )}
                            </div>
                        )
                    })}

                    {hasMore && !isExpanded && (
                        <button
                            className={styles.showMoreBtn}
                            onClick={() => setIsExpanded(true)}
                        >
                            Показать еще ({tx.lessonPayments.length - 3})
                        </button>
                    )}
                    {isExpanded && (
                        <button
                            className={styles.showMoreBtn}
                            onClick={() => setIsExpanded(false)}
                        >
                            Свернуть
                        </button>
                    )}
                </div>
            )}
        </div>
    )
}

export const TransactionsModal: React.FC<TransactionsModalProps> = ({
    isOpen,
    onClose,
    initialMonth = new Date()
}) => {
    const router = useRouter()
    const [filter, setFilter] = useState(format(initialMonth, 'yyyy-MM'))
    const [transactions, setTransactions] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(false)

    const fetchTransactions = async (currentFilter: string) => {
        try {
            setIsLoading(true)
            const data = await incomeApi.getTransactions(currentFilter)
            setTransactions(data.transactions || [])
        } catch (error) {
            toast.error('Не удалось загрузить список операций')
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        if (isOpen) {
            fetchTransactions(filter)
        }
    }, [filter, isOpen])

    const monthOptions = useMemo(() => {
        const options: { value: string; label: string }[] = [{ value: 'all', label: 'За все время' }]
        const start = new Date(2025, 10, 1) // Ноябрь 2025
        const end = new Date()
        let current = end

        while (current >= start) {
            options.push({
                value: format(current, 'yyyy-MM'),
                label: format(current, 'LLLL yyyy', { locale: ru })
            })
            current = subMonths(current, 1)
        }
        return options
    }, [])

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Все операции"
            maxWidth="600px"
        >
            <div className={styles.modalHeader}>
                <Dropdown
                    options={monthOptions}
                    value={filter}
                    onChange={(val) => setFilter(val)}
                    className={styles.dropdownCustom}
                    searchable={false}
                />
                <p className={styles.subtitle}>
                    {transactions.length} операций
                </p>
            </div>

            <div className={styles.transactionsList}>
                <AnimatePresence mode="wait">
                    {isLoading ? (
                        <motion.div
                            key="loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className={styles.emptyState}
                        >
                            Загрузка...
                        </motion.div>
                    ) : transactions.length === 0 ? (
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className={styles.emptyState}
                        >
                            Нет операций за выбранный период
                        </motion.div>
                    ) : (
                        <motion.div
                            key={filter}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
                        >
                            {transactions.map((tx, i) => (
                                <TransactionItem
                                    key={tx.id || i}
                                    tx={tx}
                                    onClose={onClose}
                                    router={router}
                                />
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </Modal>
    )
}
