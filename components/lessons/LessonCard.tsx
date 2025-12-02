import React from 'react'
import { useRouter } from 'next/navigation'
import { formatSmartDate } from '@/lib/dateUtils'
import { Lesson } from '@/types'
import { LessonActions } from './LessonActions'
import { NoteIcon } from '@/components/icons/Icons'
import { LessonStatusBadge } from './LessonStatusBadge'
import styles from '../../app/(dashboard)/lessons/page.module.scss'

interface LessonCardProps {
    lesson: Lesson
    onTogglePaid: (lesson: Lesson) => void
    onToggleCancel: (lesson: Lesson) => void
    onEdit: (lesson: Lesson) => void
    onDelete: (lessonId: string) => void
}

export function LessonCard({ lesson, onTogglePaid, onToggleCancel, onEdit, onDelete }: LessonCardProps) {
    const router = useRouter()

    const handleCardClick = () => {
        router.push(`/lessons/${lesson.id}`)
    }

    return (
        <div
            className={`${styles.lessonCard} ${lesson.isCanceled ? styles.canceled : ''}`}
            onClick={handleCardClick}
            style={{ cursor: 'pointer' }}
        >
            <div className={styles.lessonMain}>
                <div className={styles.lessonInfo}>
                    <div className={styles.lessonHeader}>
                        <h3 className={styles.studentName}>{lesson.student.name}</h3>
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
                    </div>
                    <p className={styles.lessonDate}>
                        {formatSmartDate(lesson.date)}
                    </p>
                    {lesson.topic && (
                        <div className={styles.lessonTopic}>
                            <NoteIcon size={14} className={styles.topicIcon} />
                            <span className={styles.topicLabel}>Тема урока:</span>
                            <span className={styles.topicText}>
                                {lesson.topic.length > 50 ? `${lesson.topic.slice(0, 50)}...` : lesson.topic}
                            </span>
                        </div>
                    )}
                </div>
                <div className={styles.lessonPriceContainer}>
                    <div className={styles.lessonPrice}>{lesson.price} ₽</div>
                    <LessonStatusBadge price={lesson.price} isPaid={lesson.isPaid} />
                </div>
            </div>
            <div className={styles.actionsBlock} onClick={(e) => e.stopPropagation()}>
                <LessonActions
                    lesson={lesson}
                    onTogglePaid={onTogglePaid}
                    onToggleCancel={onToggleCancel}
                    onEdit={onEdit}
                    onDelete={onDelete}
                />
            </div>
        </div>
    )
}
