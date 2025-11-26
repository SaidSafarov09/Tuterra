'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import styles from './page.module.scss'

interface Lesson {
    id: string
    date: string
    price: number
    isPaid: boolean
    student: {
        id: string
        name: string
    }
}

interface DashboardStats {
    studentsCount: number
    upcomingLessons: Lesson[]
    unpaidLessons: Lesson[]
    monthlyIncome: number
}

export default function DashboardPage() {
    const [stats, setStats] = useState<DashboardStats | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        fetchStats()
    }, [])

    const fetchStats = async () => {
        try {
            const response = await fetch('/api/stats')
            if (response.ok) {
                const data = await response.json()
                setStats(data)
            }
        } catch (error) {
            console.error('Failed to fetch stats:', error)
        } finally {
            setIsLoading(false)
        }
    }

    if (isLoading) {
        return <div className={styles.loading}>Загрузка...</div>
    }

    return (
        <div>
            <div className={styles.header}>
                <h1 className={styles.title}>Dashboard</h1>
                <p className={styles.subtitle}>Обзор вашей активности</p>
            </div>

            <div className={styles.statsGrid}>
                <Link href="/students" className={styles.statCardLink}>
                    <div className={styles.statCard}>
                        <div className={styles.statIcon}>👥</div>
                        <p className={styles.statLabel}>Всего учеников</p>
                        <h2 className={styles.statValue}>{stats?.studentsCount || 0}</h2>
                    </div>
                </Link>

                <Link href="/lessons" className={styles.statCardLink}>
                    <div className={styles.statCard}>
                        <div className={styles.statIcon}>📚</div>
                        <p className={styles.statLabel}>Ближайших занятий</p>
                        <h2 className={styles.statValue}>{stats?.upcomingLessons?.length || 0}</h2>
                    </div>
                </Link>

                <Link href="/lessons?filter=unpaid" className={styles.statCardLink}>
                    <div className={styles.statCard}>
                        <div className={styles.statIcon}>⚠️</div>
                        <p className={styles.statLabel}>Неоплаченных</p>
                        <h2 className={styles.statValue}>{stats?.unpaidLessons?.length || 0}</h2>
                    </div>
                </Link>

                <Link href="/income" className={styles.statCardLink}>
                    <div className={styles.statCard}>
                        <div className={styles.statIcon}>💰</div>
                        <p className={styles.statLabel}>Доход за месяц</p>
                        <h2 className={styles.statValue}>{stats?.monthlyIncome || 0} ₽</h2>
                    </div>
                </Link>
            </div>

            <div className={styles.sectionsGrid}>
                <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <h3 className={styles.sectionTitle}>Ближайшие занятия</h3>
                        <Link href="/lessons" className={styles.viewAll}>
                            Все занятия →
                        </Link>
                    </div>

                    {stats?.upcomingLessons && stats.upcomingLessons.length > 0 ? (
                        <div className={styles.lessonsList}>
                            {stats.upcomingLessons.map((lesson) => (
                                <Link
                                    key={lesson?.id}
                                    href={`/lessons/${lesson?.id}`}
                                    className={styles.lessonItem}
                                >
                                    <div className={styles.lessonHeader}>
                                        <div>
                                            <h4 className={styles.studentName}>{lesson.student.name}</h4>
                                            <p className={styles.lessonDate}>
                                                {format(new Date(lesson.date), 'dd MMMM, HH:mm', { locale: ru })}
                                            </p>
                                        </div>
                                        <div>
                                            <div className={styles.lessonPrice}>{lesson.price} ₽</div>
                                            {!lesson.isPaid && (
                                                <span className={`${styles.badge} ${styles.badgeUnpaid}`}>
                                                    Не оплачено
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className={styles.emptyState}>Нет ближайших занятий</div>
                    )}
                </div>

                <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <h3 className={styles.sectionTitle}>Неоплаченные занятия</h3>
                        <Link href="/lessons?filter=unpaid" className={styles.viewAll}>
                            Все неоплаченные →
                        </Link>
                    </div>

                    {stats?.unpaidLessons && stats.unpaidLessons.length > 0 ? (
                        <div className={styles.lessonsList}>
                            {stats.unpaidLessons.slice(0, 5).map((lesson) => (
                                <Link
                                    key={lesson?.id}
                                    href={`/lessons/${lesson?.id}`}
                                    className={styles.lessonItem}
                                >
                                    <div className={styles.lessonHeader}>
                                        <div>
                                            <h4 className={styles.studentName}>{lesson.student.name}</h4>
                                            <p className={styles.lessonDate}>
                                                {format(new Date(lesson.date), 'dd MMMM, HH:mm', { locale: ru })}
                                            </p>
                                        </div>
                                        <div className={styles.lessonPrice}>{lesson.price} ₽</div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className={styles.emptyState}>Все занятия оплачены! 🎉</div>
                    )}
                </div>
            </div>
        </div>
    )
}
