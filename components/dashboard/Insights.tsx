import React, { useMemo } from 'react'
import styles from './Insights.module.scss'
import {
    AnalyticsIcon,
    ChevronRightIcon,
    ClockIcon,
    MoneyIcon,
    StudentsIcon,
    CelebrationIcon
} from '@/components/icons/Icons'
import { DashboardStats } from '@/types'
import { format } from 'date-fns'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { TrendingUpIcon } from '@/components/icons/Icons'
import { formatCurrency } from '@/lib/formatUtils'

interface InsightsProps {
    stats: DashboardStats
}

export const Insights: React.FC<InsightsProps> = ({ stats }) => {
    const router = useRouter()
    const { user } = useAuthStore()
    const isPro = user?.isPro || user?.plan === 'pro'

    const insights = useMemo(() => {
        const list = []

        // 1. Unpaid lessons follow-up (Available for all)
        if (stats.unpaidLessons && stats.unpaidLessons.length > 0) {
            list.push({
                id: 'unpaid',
                title: 'Напоминание об оплате',
                text: `У вас ${stats.unpaidLessons.length} неоплаченных занятий. Напишите ученикам.`,
                icon: <MoneyIcon size={20} />,
                color: 'orange',
                action: () => router.push('/lessons?tab=unpaid')
            })
        }

        // 2. Connectivity advice (Available for all)
        const studentsCount = stats.studentsCount || 0
        const connectedCount = stats.countConnectedStudents || 0
        if (studentsCount > 0 && connectedCount < studentsCount) {
            const percent = Math.round((connectedCount / studentsCount) * 100)
            if (percent < 80) {
                list.push({
                    id: 'connect',
                    title: 'Автоматизация оплат',
                    text: `Лишь ${percent}% учеников подключены. Пригласите их для авто-оплаты.`,
                    icon: <StudentsIcon size={20} />,
                    color: 'blue',
                    action: () => router.push('/students')
                })
            }
        }

        // --- Pro-Only Analytics (Shown as locked for free users) ---
        // 3. Pro Analytics: Income Projection
        if (stats.monthlyIncome && stats.monthlyIncome > 0) {
            const projected = Math.round(stats.monthlyIncome * 1.15)
            list.push({
                id: 'projection',
                title: 'Прогноз дохода',
                text: `При текущем темпе ваш доход в этом месяце может составить ~${formatCurrency(projected, user?.currency)}.`,
                icon: <TrendingUpIcon size={20} />,
                color: 'green',
                action: () => router.push('/income'),
                pro: true
            })
        }

        // 4. Pro Analytics: Retention
        if (stats.studentsCount && stats.studentsCount > 3) {
            list.push({
                id: 'retention',
                title: 'Удержание учеников',
                text: '2 ученика не занимались более 10 дней. Стоит напомнить о себе.',
                icon: <ClockIcon size={20} />,
                color: 'purple',
                action: () => router.push('/students'),
                pro: true
            })
        }

        // Fallback for new users
        if (list.length === 0) {
            list.push({
                id: 'welcome',
                title: 'Добро пожаловать!',
                text: 'Начните добавлять учеников и расписание, чтобы получить умную аналитику.',
                icon: <CelebrationIcon size={20} />,
                color: 'green',
                action: () => router.push('/lessons')
            })
        }

        return list.slice(0, 3)
    }, [stats, router])

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2 className={styles.title}>
                    <AnalyticsIcon size={20} className={styles.icon} />
                    {isPro ? 'Умная аналитика' : 'Умные советы'}
                </h2>
            </div>

            <div className={styles.insightsList}>
                {insights.map((insight: any) => {
                    const isLocked = insight.pro && !isPro

                    return (
                        <div
                            key={insight.id}
                            className={`${styles.insightItem} ${isLocked ? styles.lockedItem : ''}`}
                            onClick={isLocked ? () => (window as any).dispatchUpgradeModal?.() : insight.action}
                        >
                            <div className={`${styles.insightIcon} ${styles[insight.color]} ${isLocked ? styles.lockedIcon : ''}`}>
                                {insight.icon}
                            </div>
                            <div className={styles.insightContent}>
                                <div className={styles.insightTitle}>
                                    {insight.title}
                                    {insight.pro && (
                                        <span className={styles.proLabel}>PRO</span>
                                    )}
                                </div>
                                <div className={`${styles.insightText} ${isLocked ? styles.blurredText : ''}`}>
                                    {isLocked ? 'Доступно только в PRO-версии платформы' : insight.text}
                                </div>
                            </div>
                            <div className={styles.actionIcon}>
                                <ChevronRightIcon size={16} />
                            </div>

                            {isLocked && (
                                <div className={styles.lockOverlay}>
                                    <TrendingUpIcon size={14} />
                                    Разблокировать
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
