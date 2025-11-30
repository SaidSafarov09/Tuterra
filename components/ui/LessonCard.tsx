import React, { useState } from 'react'
import Link from 'next/link'
import { Lesson } from '@/types'
import { formatSmartDate } from '@/lib/dateUtils'
import { ClockIcon, NoteIcon } from '@/components/icons/Icons'
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
    const [showTopic, setShowTopic] = useState(false)
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
                    {lesson.topic && (
                        <div
                            className={styles.topicTrigger}
                            onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                setShowTopic(!showTopic)
                            }}
                        >
                            <span className={styles.topicLabel}>Тема:</span>
                            <NoteIcon size={14} />

                            {showTopic && (
                                <div className={styles.topicPopup} onClick={(e) => e.stopPropagation()}>
                                    <p>{lesson.topic.length > 50 ? `${lesson.topic.slice(0, 50)}...` : lesson.topic}</p>
                                    <span className={styles.moreLink}>Подробнее</span>
                                </div>
                            )}
                        </div>
                    )}
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
