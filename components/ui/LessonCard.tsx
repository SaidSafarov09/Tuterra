import React, { useState } from 'react'
import Link from 'next/link'
import { Lesson } from '@/types'
import { formatSmartDate } from '@/lib/dateUtils'
import { ClockIcon, NoteIcon } from '@/components/icons/Icons'
import { LessonStatusBadge } from '@/components/lessons/LessonStatusBadge'
import { LessonActions } from '@/components/lessons/LessonActions'
import styles from './LessonCard.module.scss'

interface LessonCardProps {
    lesson: Lesson
    variant?: 'default' | 'compact'
    showActions?: boolean
    onTogglePaid?: (lesson: Lesson) => void
    onToggleCancel?: (lesson: Lesson) => void
    onEdit?: (lesson: Lesson) => void
    onDelete?: (lessonId: string) => void
}

export const LessonCard: React.FC<LessonCardProps> = ({
    lesson,
    variant = 'default',
    showActions = false,
    onTogglePaid,
    onToggleCancel,
    onEdit,
    onDelete,
}) => {
    const [showTopic, setShowTopic] = useState(false)

    const CardContent = (
        <div className={`${styles.card} ${variant === 'compact' ? styles.compact : ''} ${lesson.isCanceled ? styles.canceled : ''}`}>
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
                    <LessonStatusBadge price={lesson.price} isPaid={lesson.isPaid} />
                </div>
            </div>
        </div>
    )

    if (showActions) {
        return (
            <div className={styles.cardWrapper}>
                <Link href={`/lessons/${lesson.id}`} style={{ textDecoration: 'none', display: 'block' }}>
                    {CardContent}
                </Link>
                {onTogglePaid && onEdit && onDelete && (
                    <div className={styles.actionsFooter} onClick={(e) => e.stopPropagation()}>
                        <LessonActions
                            lesson={lesson}
                            onTogglePaid={onTogglePaid}
                            onToggleCancel={onToggleCancel}
                            onEdit={onEdit}
                            onDelete={onDelete}
                        />
                    </div>
                )}
            </div>
        )
    }

    return (
        <Link href={`/lessons/${lesson.id}`} style={{ textDecoration: 'none', display: 'block' }}>
            {CardContent}
        </Link>
    )
}
