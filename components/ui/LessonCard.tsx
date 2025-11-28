import React from 'react'
import Link from 'next/link'
import { Lesson } from '@/types'
import { formatSmartDate } from '@/lib/dateUtils'
import { ClockIcon } from '@/components/icons/Icons'
import styles from './LessonCard.module.scss'

interface LessonCardProps {
    lesson: Lesson
    variant?: 'default' | 'compact'
    showActions?: boolean
    onTogglePaid?: (lesson: Lesson) => void
    onToggleCancel?: (lesson: Lesson) => void
    onDelete?: (lessonId: string) => void
}

export const LessonCard: React.FC<LessonCardProps> = ({
    lesson,
    variant = 'default',
    showActions = false,
}) => {
    const isPast = new Date(lesson.date) < new Date()

    return (
        <Link
            href={`/lessons/${lesson.id}`}
            className={`${styles.card} ${variant === 'compact' ? styles.compact : ''}`}
        >
            <div className={styles.header}>
                <div className={styles.info}>
                    <h4 className={styles.studentName}>{lesson.student.name}</h4>
                    {lesson.subject && (
                        <span
                            className={styles.subjectBadge}
                            style={{
                                color: lesson.subject.color,
                                backgroundColor: lesson.subject.color + '15',
                                borderColor: lesson.subject.color + '30',
                            }}
                        >
                            {lesson.subject.name}
                        </span>
                    )}
                    <p className={styles.date}>
                        <ClockIcon size={14} color="var(--text-secondary)" />
                        {formatSmartDate(lesson.date)}
                    </p>
                </div>

                <div className={styles.priceContainer}>
                    <div
                        className={`${styles.price} ${lesson.isPaid ? styles.pricePaid : styles.priceUnpaid
                            }`}
                    >
                        {lesson.price} ₽
                    </div>
                    {lesson.isPaid ? (
                        <span className={`${styles.badge} ${styles.badgePaid}`}>
                            Оплачено
                        </span>
                    ) : (
                        <span className={`${styles.badge} ${styles.badgeUnpaid}`}>
                            Не оплачено
                        </span>
                    )}
                </div>
            </div>
        </Link>
    )
}
