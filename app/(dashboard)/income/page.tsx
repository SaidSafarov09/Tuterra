'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { format, subMonths, addMonths } from 'date-fns'
import { ru } from 'date-fns/locale'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeftIcon, ArrowRightIcon, HomeIcon, WalletIcon } from '@/components/icons/Icons'
import { Button } from '@/components/ui/Button'
import { MonthlyData } from '@/types'
import { IncomeCardSkeleton } from '@/components/skeletons'
import { Skeleton } from '@/components/ui/Skeleton'
import { incomeApi } from '@/services/api'
import styles from './page.module.scss'
import { EmptyState } from '@/components/ui/EmptyState'
import { INCOME_MESSAGES } from '@/constants/messages'
import { TransactionsModal } from '@/components/income/TransactionsModal'
import { DebtsBlock } from '@/components/income/DebtsBlock'
import { CurrentMonthCard } from '@/components/income/CurrentMonthCard'
import { PrevMonthCard } from '@/components/income/PrevMonthCard'
import { RecentTransactionsCard } from '@/components/income/RecentTransactionsCard'
import { IncomeCharts } from '@/components/income/IncomeCharts'
import { useCheckLimit } from '@/hooks/useCheckLimit'
import { useAuthStore } from '@/store/auth'
import { IncomeInsights } from '@/components/income/IncomeInsights'

export default function IncomePage() {
    const router = useRouter()
    const { user } = useAuthStore()
    const { checkLimit, isPro, UpgradeModal } = useCheckLimit()
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
    const [isSwitching, setIsSwitching] = useState(false)
    const [currentMonthDuration, setCurrentMonthDuration] = useState(0)
    const [previousMonthDuration, setPreviousMonthDuration] = useState(0)
    const [recentTransactions, setRecentTransactions] = useState<any[]>([])
    const [debts, setDebts] = useState<any[]>([])
    const [insights, setInsights] = useState<any[]>([])
    const [isModalOpen, setIsModalOpen] = useState(false)

    const fetchIncomeData = async (isMonthSwitch = false) => {
        try {
            if (isMonthSwitch) setIsSwitching(true)
            else setIsLoading(true)

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
            setDebts(data.debts || [])
            setInsights(data.insights || [])

            setHasAnyIncomeEver(Boolean(data.hasAnyIncomeEver))
        } catch (error) {
            console.error('Income Fetch Error:', error)
            toast.error('Не удалось загрузить данные о доходах')
        } finally {
            setIsLoading(false)
            setIsSwitching(false)
        }
    }

    useEffect(() => {
        fetchIncomeData(!isLoading)
    }, [currentDate])

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

            <div data-onboarding="income-stats" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
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
                        {user?.showInsightsBlock !== false && insights.length > 0 && (
                            <IncomeInsights insights={insights} />
                        )}
                        <DebtsBlock debts={debts} />

                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentDate.toISOString()}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: isSwitching ? 0.5 : 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                            >
                                <div className={styles.statsGrid}>
                                    <CurrentMonthCard
                                        date={currentDate}
                                        income={currentMonthIncome}
                                        previousIncome={previousMonthIncome}
                                        duration={currentMonthDuration}
                                        lessonsCount={currentLessonsCount}
                                        averageCheck={averageCheck}
                                        percentageChange={percentageChange}
                                        isGrowth={isGrowth}
                                        isPro={isPro}
                                        onUnlock={() => checkLimit('income', 1)}
                                    />

                                    <PrevMonthCard
                                        date={currentDate}
                                        income={previousMonthIncome}
                                        duration={previousMonthDuration}
                                        lessonsCount={previousLessonsCount}
                                        averageCheck={previousAverageCheck}
                                        isPro={isPro}
                                        onUnlock={() => checkLimit('income', 1)}
                                    />

                                    <RecentTransactionsCard
                                        transactions={recentTransactions}
                                        onViewAll={() => {
                                            if (checkLimit('income', 1)) {
                                                setIsModalOpen(true)
                                            }
                                        }}
                                        isLocked={!isPro}
                                    />
                                </div>

                                <IncomeCharts data={monthlyData} />
                            </motion.div>
                        </AnimatePresence>
                        <TransactionsModal
                            isOpen={isModalOpen}
                            onClose={() => setIsModalOpen(false)}
                            initialMonth={currentDate}
                        />
                        {UpgradeModal}
                    </>
                )}
            </div>
        </div>
    )
}
