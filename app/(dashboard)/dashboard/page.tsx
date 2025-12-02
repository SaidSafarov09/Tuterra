'use client'

import React from 'react'
import {
    UsersGroupIcon,
    BookIcon,
    AlertIcon,
    MoneyIcon,
    CelebrationIcon,
    CalendarIcon,
} from '@/components/icons/Icons'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatCard } from '@/components/ui/StatCard'
import { Section } from '@/components/ui/Section'
import { LessonCard } from '@/components/ui/LessonCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { StatCardSkeleton, LessonCardSkeleton } from '@/components/skeletons'
import { statsApi } from '@/services/api'
import { GENERAL_MESSAGES } from '@/constants/messages'
import { toast } from 'sonner'
import { DashboardStats } from '@/types'
import styles from './page.module.scss'

export default function DashboardPage() {
    const [stats, setStats] = React.useState<DashboardStats | null>(null)
    const [isLoading, setIsLoading] = React.useState(true)

    React.useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await statsApi.get()
                setStats(data)
            } catch (error) {
                toast.error(GENERAL_MESSAGES.FETCH_ERROR || 'Не удалось загрузить статистику')
            } finally {
                setIsLoading(false)
            }
        }
        fetchStats()
    }, [])

    return (
        <div>
            <PageHeader title="Главная" subtitle="Обзор вашей активности" />

            <div className={styles.statsContainer}>
                <div className={styles.statsGrid}>
                    {isLoading ? (
                        <>
                            <StatCardSkeleton />
                            <StatCardSkeleton />
                            <StatCardSkeleton />
                            <StatCardSkeleton />
                        </>
                    ) : (
                        <>
                            <StatCard
                                icon={<UsersGroupIcon size={32} color="#4F46E5" />}
                                label="Всего учеников"
                                value={stats?.studentsCount || 0}
                                href="/students"
                            />
                            <StatCard
                                icon={<BookIcon size={32} color="#10B981" />}
                                label="Ближайших занятий"
                                value={stats?.upcomingLessons?.length || 0}
                                href="/lessons"
                            />
                            <StatCard
                                icon={<AlertIcon size={32} color="#F59E0B" />}
                                label="Неоплаченных"
                                value={stats?.unpaidLessons?.length || 0}
                                href="/lessons?filter=unpaid"
                            />
                            <StatCard
                                icon={<MoneyIcon size={32} color="#14B8A6" />}
                                label="Доход за месяц"
                                value={`${stats?.monthlyIncome || 0} ₽`}
                                href="/income"
                            />
                        </>
                    )}
                </div>

                <div className={styles.sectionsGrid}>
                    <Section title="Ближайшие занятия" viewAllHref="/lessons" viewAllText="Все занятия →">
                        {isLoading ? (
                            <div className={styles.lessonsList}>
                                <LessonCardSkeleton variant="compact" />
                                <LessonCardSkeleton variant="compact" />
                                <LessonCardSkeleton variant="compact" />
                            </div>
                        ) : stats?.upcomingLessons && stats.upcomingLessons.length > 0 ? (
                            <div className={styles.lessonsList}>
                                {stats.upcomingLessons.map((lesson) => (
                                    <LessonCard key={lesson.id} lesson={lesson} variant="compact" />
                                ))}
                            </div>
                        ) : (
                            <EmptyState title="Нет ближайших занятий" description={undefined} icon={<CalendarIcon size={48} color="var(--primary)" />} />
                        )}
                    </Section>

                    <Section
                        title="Неоплаченные занятия"
                        viewAllHref="/lessons?filter=unpaid"
                        viewAllText="Все неоплаченные →"
                    >
                        {isLoading ? (
                            <div className={styles.lessonsList}>
                                <LessonCardSkeleton variant="compact" />
                                <LessonCardSkeleton variant="compact" />
                                <LessonCardSkeleton variant="compact" />
                            </div>
                        ) : stats?.unpaidLessons && stats.unpaidLessons.length > 0 ? (
                            <div className={styles.lessonsList}>
                                {stats.unpaidLessons.slice(0, 5).map((lesson) => (
                                    <LessonCard key={lesson.id} lesson={lesson} variant="compact" />
                                ))}
                            </div>
                        ) : (
                            <EmptyState
                                icon={<CelebrationIcon size={48} color="var(--success)" />}
                                title="Все занятия оплачены!" description={undefined} />
                        )}
                    </Section>
                </div>
            </div>
        </div>
    )
}