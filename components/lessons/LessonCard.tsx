import React from 'react'
import { useRouter } from 'next/navigation'
import { formatSmartDate } from '@/lib/dateUtils'
import { isPast } from 'date-fns'
import { CheckIcon, XCircleIcon, EditIcon, DeleteIcon } from '@/components/icons/Icons'
import { Lesson } from '@/types'
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
                </div>
                <div className={styles.lessonPriceContainer}>
                    <div className={styles.lessonPrice}>{lesson.price} ₽</div>
                    <span
                        className={`${styles.badge} ${lesson.isPaid ? styles.badgePaid : styles.badgeUnpaid
                            }`}
                    >
                        {lesson.isPaid ? 'Оплачено' : 'Не оплачено'}
                    </span>
                </div>
            </div>
            <div className={styles.actionsBlock} onClick={(e) => e.stopPropagation()}>
                <div className={styles.lessonActions}>
                    <button
                        className={`${styles.actionButton} ${styles.paidButton} ${lesson.isPaid ? styles.isPaid : ''}`}
                        onClick={() => onTogglePaid(lesson)}
                        disabled={lesson.isCanceled}
                    >
                        <CheckIcon size={16} />
                        {lesson.isPaid ? 'Оплачено' : 'Оплатить'}
                    </button>

                    {!isPast(new Date(lesson.date)) && (
                        <button
                            className={`${styles.actionButton} ${lesson.isCanceled ? styles.restoreButton : styles.cancelButton}`}
                            onClick={() => onToggleCancel(lesson)}
                        >
                            {lesson.isCanceled ? (
                                <>
                                    <CheckIcon size={16} />
                                    Восстановить
                                </>
                            ) : (
                                <>
                                    <XCircleIcon size={16} />
                                    Отменить
                                </>
                            )}
                        </button>
                    )}

                    <button
                        className={`${styles.actionButton} ${styles.editButton}`}
                        onClick={() => onEdit(lesson)}
                        disabled={isPast(new Date(lesson.date))}
                    >
                        <EditIcon size={16} />
                        Изменить
                    </button>
                    <button
                        className={`${styles.actionButton} ${styles.deleteButton}`}
                        onClick={() => onDelete(lesson.id)}
                    >
                        <DeleteIcon size={16} />
                        Удалить
                    </button>
                </div>
            </div>
        </div>
    )
}
