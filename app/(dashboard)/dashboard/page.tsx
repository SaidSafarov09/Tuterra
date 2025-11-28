'use client'

import React from 'react'
import {
    UsersGroupIcon,
    BookIcon,
    AlertIcon,
    MoneyIcon,
    CelebrationIcon,
} from '@/components/icons/Icons'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatCard } from '@/components/ui/StatCard'
import { Section } from '@/components/ui/Section'
import { LessonCard } from '@/components/ui/LessonCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { useFetch } from '@/hooks/useFetch'
import { DashboardStats } from '@/types'
import styles from './page.module.scss'

export default function DashboardPage() {
    const { data: stats, isLoading } = useFetch<DashboardStats>('/api/stats')

    if (isLoading) {
        return <div className={styles.loading}>Загрузка...</div>
    }

    return (
        <div>
            <PageHeader title="Главная" subtitle="Обзор вашей активности" />

            <div className={styles.statsGrid}>
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
            </div>

            <div className={styles.sectionsGrid}>
                <Section title="Ближайшие занятия" viewAllHref="/lessons" viewAllText="Все занятия →">
                    {stats?.upcomingLessons && stats.upcomingLessons.length > 0 ? (
                        <div className={styles.lessonsList}>
                            {stats.upcomingLessons.map((lesson) => (
                                <LessonCard key={lesson.id} lesson={lesson} variant="compact" />
                            ))}
                        </div>
                    ) : (
                        <EmptyState title="Нет ближайших занятий" />
                    )}
                </Section>

                <Section
                    title="Неоплаченные занятия"
                    viewAllHref="/lessons?filter=unpaid"
                    viewAllText="Все неоплаченные →"
                >
                    {stats?.unpaidLessons && stats.unpaidLessons.length > 0 ? (
                        <div className={styles.lessonsList}>
                            {stats.unpaidLessons.slice(0, 5).map((lesson) => (
                                <LessonCard key={lesson.id} lesson={lesson} variant="compact" />
                            ))}
                        </div>
                    ) : (
                        <EmptyState
                            icon={<CelebrationIcon size={48} color="#EC4899" />}
                            title="Все занятия оплачены!"
                        />
                    )}
                </Section>
            </div>
        </div>
    )
}
