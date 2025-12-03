import React from 'react'
import { LessonsIcon } from '@/components/icons/Icons'
import { Button } from '@/components/ui/Button'
import { LessonFilter } from '@/types'
import styles from '../../app/(dashboard)/lessons/page.module.scss'

interface EmptyLessonsStateProps {
    onAddLesson: () => void
    filter?: LessonFilter
}

const EMPTY_MESSAGES: Record<LessonFilter, { title: string; description: string }> = {
    all: {
        title: 'Нет занятий',
        description: 'Добавьте первое занятие, чтобы начать работу'
    },
    upcoming: {
        title: 'Нет предстоящих занятий',
        description: 'У вас пока нет запланированных занятий'
    },
    past: {
        title: 'Нет прошедших занятий',
        description: 'Здесь будут отображаться завершенные занятия'
    },
    unpaid: {
        title: 'Нет неоплаченных занятий',
        description: 'Все занятия оплачены!'
    },
    canceled: {
        title: 'Нет отмененных занятий',
        description: 'У вас нет отмененных занятий'
    }
}

export function EmptyLessonsState({ onAddLesson, filter = 'all' }: EmptyLessonsStateProps) {
    const message = EMPTY_MESSAGES[filter]

    return (
        <div className={styles.emptyState}>
            <div className={styles.emptyStateIcon}><LessonsIcon size={64} color="#9CA3AF" /></div>
            <h2 className={styles.emptyStateTitle}>{message.title}</h2>
            <p className={styles.emptyStateText}>
                {message.description}
            </p>
            {filter === 'all' && <Button onClick={onAddLesson}>Добавить занятие</Button>}
        </div>
    )
}
