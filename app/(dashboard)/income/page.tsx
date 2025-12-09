'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { format, subMonths, addMonths } from 'date-fns'
import { ru } from 'date-fns/locale'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import { ArrowLeftIcon, ArrowRightIcon, HomeIcon, WalletIcon, ClockIcon, HistoryIcon, ReceiptIcon, UserIcon } from '@/components/icons/Icons'
import { Button } from '@/components/ui/Button'
import { MonthlyData } from '@/types'
import { IncomeCardSkeleton } from '@/components/skeletons'
import { Skeleton } from '@/components/ui/Skeleton'
import { incomeApi } from '@/services/api'
import styles from './page.module.scss'
import { formatDuration } from '@/lib/dateUtils'

import { EmptyState } from '@/components/ui/EmptyState'
import { INCOME_MESSAGES } from '@/constants/messages'

export default function IncomePage() {
    const router = useRouter()
    const [currentDate, setCurrentDate] = useState(new Date())
    const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([])
    const [currentMonthIncome, setCurrentMonthIncome] = useState(0)
    const [previousMonthIncome, setPreviousMonthIncome] = useState(0)
    const [currentLessonsCount, setCurrentLessonsCount] = useState(0)
    const [previousLessonsCount, setPreviousLessonsCount] = useState(0)
    const [averageCheck, setAverageCheck] = useState(0)
    const [previousAverageCheck, setPreviousAverageCheck] = useState(0)
    const [hasAnyIncomeEver, setHasAnyIncomeEver] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [currentMonthDuration, setCurrentMonthDuration] = useState(0)
    const [previousMonthDuration, setPreviousMonthDuration] = useState(0)
    const [recentTransactions, setRecentTransactions] = useState<any[]>([])

    useEffect(() => {
        fetchIncomeData()
    }, [currentDate])

    const fetchIncomeData = async () => {
        try {
            setIsLoading(true)
            const data = await incomeApi.get(currentDate.toISOString())
            setMonthlyData(data.monthlyData || [])
            setCurrentMonthIncome(data.currentMonthIncome || 0)
            setPreviousMonthIncome(data.previousMonthIncome || 0)
            setCurrentLessonsCount(data.currentLessonsCount || 0)
            setAverageCheck(data.averageCheck || 0)

            setPreviousLessonsCount(data.previousLessonsCount || 0)
            setPreviousAverageCheck(data.previousAverageCheck || 0)
            setCurrentMonthDuration(data.currentMonthDuration || 0)
            setPreviousMonthDuration(data.previousMonthDuration || 0)
            setRecentTransactions(data.recentTransactions || [])

            console.log('Income Data:', {
                currentMonthIncome: data.currentMonthIncome,
                hasAnyIncomeEver: data.hasAnyIncomeEver
            })

            setHasAnyIncomeEver(Boolean(data.hasAnyIncomeEver))
        } catch (error) {
            console.error('Income Fetch Error:', error)
            toast.error('Не удалось загрузить данные о доходах')
        } finally {
            setIsLoading(false)
        }
    }

    const handlePreviousMonth = () => {
        setCurrentDate(subMonths(currentDate, 1))
    }

    const handleNextMonth = () => {
        setCurrentDate(addMonths(currentDate, 1))
    }

    const handleToday = () => {
        setCurrentDate(new Date())
    }

    const percentageChange =
        previousMonthIncome > 0
            ? ((currentMonthIncome - previousMonthIncome) / previousMonthIncome) * 100
            : currentMonthIncome > 0
                ? 100
                : 0

    const isGrowth = percentageChange >= 0
    const isNextMonthDisabled = addMonths(currentDate, 1) > new Date()
    const isPreviousMonthDisabled = subMonths(currentDate, 1) < new Date(2025, 10, 1)

    const showEmptyState = currentMonthIncome === 0

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.headerText}>
                    <h1 className={styles.title}>Доходы</h1>
                    <p className={styles.subtitle}>Аналитика ваших доходов</p>
                </div>
            </div>

            <div className={styles.navigation}>
                <button
                    className={styles.navButton}
                    onClick={handlePreviousMonth}
                    disabled={isPreviousMonthDisabled}
                    style={{ opacity: isPreviousMonthDisabled ? 0.5 : 1, cursor: isPreviousMonthDisabled ? 'not-allowed' : 'pointer' }}
                >
                    <ArrowLeftIcon size={18} />
                </button>
                <div className={styles.currentMonth}>
                    {format(currentDate, 'LLLL yyyy', { locale: ru })}
                </div>
                <button
                    className={styles.navButton}
                    onClick={handleNextMonth}
                    disabled={isNextMonthDisabled}
                    style={{ opacity: isNextMonthDisabled ? 0.5 : 1, cursor: isNextMonthDisabled ? 'not-allowed' : 'pointer' }}
                >
                    <ArrowRightIcon size={18} />
                </button>
                <Button variant="ghost" size="small" onClick={handleToday}>
                    <HomeIcon size={18} />
                </Button>
            </div>

            {isLoading ? (
                <div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '32px' }}>
                        <IncomeCardSkeleton />
                        <IncomeCardSkeleton />
                    </div>
                    <div style={{
                        background: 'var(--background)',
                        border: '1px solid var(--border)',
                        borderRadius: '16px',
                        padding: '24px',
                        marginBottom: '24px'
                    }}>
                        <Skeleton width="30%" height={24} style={{ marginBottom: '24px' }} />
                        <Skeleton width="100%" height={300} />
                    </div>
                    <div style={{
                        background: 'var(--background)',
                        border: '1px solid var(--border)',
                        borderRadius: '16px',
                        padding: '24px'
                    }}>
                        <Skeleton width="30%" height={24} style={{ marginBottom: '24px' }} />
                        <Skeleton width="100%" height={300} />
                    </div>
                </div>
            ) : showEmptyState ? (
                !hasAnyIncomeEver ? (
                    <EmptyState
                        title={INCOME_MESSAGES.EMPTY_STATE.NO_DATA_TITLE}
                        description={INCOME_MESSAGES.EMPTY_STATE.NO_DATA_DESCRIPTION}
                        icon={<WalletIcon size={48} color="#9CA3AF" />}
                    />
                ) : (
                    <EmptyState
                        title={INCOME_MESSAGES.EMPTY_STATE.NO_INCOME_THIS_MONTH_TITLE}
                        description={INCOME_MESSAGES.EMPTY_STATE.NO_INCOME_THIS_MONTH_DESCRIPTION(currentDate)}
                        icon={<WalletIcon size={48} color="#9CA3AF" />}
                    />
                )
            ) : (
                <>
                    <div className={styles.statsGrid}>
                        <div className={styles.statCard}>
                            <div className={styles.statHeader}>
                                <h3 className={styles.statTitle}>Доход за месяц</h3>
                                {previousMonthIncome > 0 && (
                                    <div className={`${styles.badge} ${isGrowth ? styles.badgeSuccess : styles.badgeDanger}`}>
                                        {isGrowth ? '↑' : '↓'} {Math.abs(percentageChange).toFixed(1)}%
                                    </div>
                                )}
                            </div>
                            <div className={styles.statValue}>{currentMonthIncome.toLocaleString()} ₽</div>
                            <p className={styles.statDescription}>
                                Итого заработано за {format(currentDate, 'LLLL yyyy', { locale: ru })}
                            </p>

                            <div className={styles.durationBlock}>
                                <ClockIcon size={20} color="var(--primary)" />
                                <div className={styles.durationText}>
                                    Рабочие часы -
                                    <strong>{formatDuration(currentMonthDuration)}</strong>
                                </div>
                            </div>

                            <div className={styles.statDetails}>
                                <div className={styles.statDetailItem}>
                                    <span className={styles.statDetailLabel}>Оплаченных занятий:</span>
                                    <span className={styles.statDetailValue}>{currentLessonsCount}</span>
                                </div>
                                <div className={styles.statDetailItem}>
                                    <span className={styles.statDetailLabel}>Средний чек:</span>
                                    <span className={styles.statDetailValue}>
                                        {averageCheck > 0 ? `${averageCheck.toLocaleString()} ₽` : '—'}
                                    </span>
                                </div>
                                {previousMonthIncome > 0 && (
                                    <div className={styles.statDetailItem}>
                                        <span className={styles.statDetailLabel}>
                                            {isGrowth ? 'Рост' : 'Снижение'}:
                                        </span>
                                        <span className={`${styles.statDetailValue} ${isGrowth ? styles.growthValue : styles.declineValue}`}>
                                            {isGrowth ? '+' : '-'}{Math.abs(currentMonthIncome - previousMonthIncome).toLocaleString()} ₽
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className={styles.statCard}>
                            <div className={styles.statHeader}>
                                <h3 className={styles.statTitle}>Предыдущий месяц</h3>
                            </div>
                            <div className={styles.statValue}>{previousMonthIncome.toLocaleString()} ₽</div>
                            <p className={styles.statDescription}>
                                {format(subMonths(currentDate, 1), 'LLLL yyyy', { locale: ru })}
                            </p>

                            <div className={styles.durationBlock}>
                                <ClockIcon size={20} color="var(--primary)" />
                                <div className={styles.durationText}>
                                    Рабочие часы -
                                    <strong>{formatDuration(previousMonthDuration)}</strong>
                                </div>
                            </div>

                            <div className={styles.statDetails}>
                                <div className={styles.statDetailItem}>
                                    <span className={styles.statDetailLabel}>Оплаченных занятий:</span>
                                    <span className={styles.statDetailValue}>{previousLessonsCount}</span>
                                </div>
                                <div className={styles.statDetailItem}>
                                    <span className={styles.statDetailLabel}>Средний чек:</span>
                                    <span className={styles.statDetailValue}>
                                        {previousAverageCheck > 0 ? `${previousAverageCheck.toLocaleString()} ₽` : '—'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className={styles.statCard}>
                            <div className={styles.statHeader}>
                                <h3 className={styles.statTitle}>Последние операции</h3>
                                <HistoryIcon size={20} color="var(--text-secondary)" />
                            </div>

                            <div className={styles.transactionsList}>
                                {recentTransactions.length === 0 ? (
                                    <p className={styles.emptyStateText} style={{ textAlign: 'center', padding: '20px 0' }}>Нет операций</p>
                                ) : (
                                    recentTransactions.map((tx, i) => (
                                        <div key={i} className={styles.transactionItem}>
                                            <div className={styles.transactionInfo}>
                                                <div className={styles.transactionIcon}>
                                                    <UserIcon size={20} />
                                                </div>
                                                <div className={styles.transactionDetails}>
                                                    <span className={styles.transactionStudent}>{tx.student.name}</span>
                                                    <span className={styles.transactionSubject}>
                                                        {tx.subject?.name || tx.subjectName || 'Без предмета'}
                                                    </span>
                                                </div>
                                            </div>
                                            <span className={styles.transactionAmount}>+{tx.price} ₽</span>
                                        </div>
                                    ))
                                )}
                            </div>

                            <a href="#"
                                className={styles.allTransactionsLink}
                                onClick={() => toast.warning("Страница в разработке")}>
                                Все операции
                                <ArrowRightIcon size={16} />
                            </a>
                        </div>
                    </div>

                    {monthlyData.length > 0 && (
                        <div className={styles.chartsGrid}>
                            <div className={styles.chartSection}>
                                <h2 className={styles.chartTitle}>График доходов</h2>
                                <div className={styles.chart}>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <LineChart data={monthlyData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                            <XAxis
                                                dataKey="month"
                                                stroke="var(--text-secondary)"
                                                style={{ fontSize: '12px' }}
                                            />
                                            <YAxis
                                                stroke="var(--text-secondary)"
                                                style={{ fontSize: '12px' }}
                                                tickFormatter={(value) => `${value.toLocaleString()} ₽`}
                                            />
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: 'var(--surface)',
                                                    border: '1px solid var(--border)',
                                                    borderRadius: '8px',
                                                    fontSize: '12px',
                                                }}
                                                formatter={(value: number) => `${value.toLocaleString()} ₽`}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="income"
                                                stroke="var(--primary)"
                                                strokeWidth={3}
                                                dot={{ fill: 'var(--primary)', r: 4 }}
                                                activeDot={{ r: 6 }}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div className={styles.chartSection}>
                                <h2 className={styles.chartTitle}>Количество занятий</h2>
                                <div className={styles.chart}>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={monthlyData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                            <XAxis
                                                dataKey="month"
                                                stroke="var(--text-secondary)"
                                                style={{ fontSize: '12px' }}
                                            />
                                            <YAxis stroke="var(--text-secondary)" style={{ fontSize: '12px' }} />
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: 'var(--surface)',
                                                    border: '1px solid var(--border)',
                                                    borderRadius: '8px',
                                                    fontSize: '12px',
                                                }}
                                            />
                                            <Bar dataKey="paid" fill="var(--success)" name="Оплаченные" radius={[8, 8, 0, 0]} />
                                            <Bar dataKey="unpaid" fill="var(--warning)" name="Неоплаченные" radius={[8, 8, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
