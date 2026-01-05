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
import { ru } from 'date-fns/locale'
import { useRouter } from 'next/navigation'

interface InsightsProps {
    stats: DashboardStats
}

export const Insights: React.FC<InsightsProps> = ({ stats }) => {
    const router = useRouter()

    const insights = useMemo(() => {
        const list = []

        // 1. Unpaid lessons follow-up
        if (stats.unpaidLessons && stats.unpaidLessons.length > 0) {
            list.push({
                id: 'unpaid',
                title: 'Напоминание об оплате',
                text: `У вас ${stats.unpaidLessons.length} неоплаченных занятий. Ускорьте получение дохода, написав ученикам.`,
                icon: <MoneyIcon size={20} />,
                color: 'orange',
                action: () => router.push('/lessons?tab=unpaid')
            })
        }

        // 2. Connectivity advice
        const studentsCount = stats.studentsCount || 0
        const connectedCount = stats.countConnectedStudents || 0
        if (studentsCount > 0 && connectedCount < studentsCount) {
            const percent = Math.round((connectedCount / studentsCount) * 100)
            if (percent < 80) {
                list.push({
                    id: 'connect',
                    title: 'Автоматизация оплат',
                    text: `Только ${percent}% учеников подключены. Пригласите остальных, чтобы не отмечать оплаты вручную.`,
                    icon: <StudentsIcon size={20} />,
                    color: 'blue',
                    action: () => router.push('/students')
                })
            }
        }

        // 3. Peak activity tip (simulated based on upcoming lessons)
        if (stats.upcomingLessons && stats.upcomingLessons.length > 5) {
            list.push({
                id: 'peak',
                title: 'Пик активности',
                text: 'У вас плотный график на ближайшие дни. Не забудьте делать перерывы по 10-15 минут между уроками.',
                icon: <ClockIcon size={20} />,
                color: 'purple',
                action: () => router.push('/calendar')
            })
        }

        // 4. Achievement / Motivation
        if (stats.monthLessonsCount && stats.monthLessonsCount > 10) {
            list.push({
                id: 'growth',
                title: 'Отличный темп!',
                text: `В этом месяце вы провели уже ${stats.monthLessonsCount} уроков. Продолжайте в том же духе!`,
                icon: <CelebrationIcon size={20} />,
                color: 'green',
                action: () => router.push('/income')
            })
        }

        // Fallback insight if list is empty
        if (list.length === 0) {
            list.push({
                id: 'welcome',
                title: 'Добро пожаловать в Tuterra!',
                text: 'Начните добавлять учеников и расписание, чтобы получать персональные советы по развитию.',
                icon: <AnalyticsIcon size={20} />,
                color: 'blue',
                action: () => router.push('/students')
            })
        }

        return list.slice(0, 3) // Only show top 3 insights
    }, [stats, router])

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2 className={styles.title}>
                    <AnalyticsIcon size={20} className={styles.icon} />
                    Умные советы
                </h2>
            </div>

            <div className={styles.insightsList}>
                {insights.map((insight) => (
                    <div
                        key={insight.id}
                        className={styles.insightItem}
                        onClick={insight.action}
                    >
                        <div className={`${styles.insightIcon} ${styles[insight.color]}`}>
                            {insight.icon}
                        </div>
                        <div className={styles.insightContent}>
                            <div className={styles.insightTitle}>{insight.title}</div>
                            <div className={styles.insightText}>{insight.text}</div>
                        </div>
                        <div className={styles.actionIcon}>
                            <ChevronRightIcon size={16} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
