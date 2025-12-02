import React from 'react'
import { isPast } from 'date-fns'
import { CheckIcon, XCircleIcon, EditIcon, DeleteIcon } from '@/components/icons/Icons'
import { Lesson } from '@/types'
import { isTrial } from '@/lib/lessonUtils'
import styles from './LessonActions.module.scss'

interface LessonActionsProps {
    lesson: Lesson
    onTogglePaid: (lesson: Lesson) => void
    onToggleCancel?: (lesson: Lesson) => void
    onEdit: (lesson: Lesson) => void
    onDelete: (lessonId: string) => void
    showCancelButton?: boolean
}

export function LessonActions({
    lesson,
    onTogglePaid,
    onToggleCancel,
    onEdit,
    onDelete,
    showCancelButton = true
}: LessonActionsProps) {
    const isLessonPast = isPast(new Date(lesson.date))
    const isTrialLesson = isTrial(lesson.price)

    return (
        <div className={styles.lessonActions}>
            {!isTrialLesson && (
                <button
                    className={`${styles.actionButton} ${styles.paidButton} ${lesson.isPaid ? styles.isPaid : ''}`}
                    onClick={() => onTogglePaid(lesson)}
                    disabled={lesson.isCanceled}
                >
                    <CheckIcon size={16} />
                    {lesson.isPaid ? 'Оплачено' : 'Оплатить'}
                </button>
            )}

            {showCancelButton && !isLessonPast && onToggleCancel && (
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
                disabled={isLessonPast}
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
    )
}
