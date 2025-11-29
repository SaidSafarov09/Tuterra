import React from 'react'
import { BookIcon } from '@/components/icons/Icons'
import { Lesson } from '@/types'
import { LessonCard } from './LessonCard'
import styles from '../../app/(dashboard)/lessons/page.module.scss'

interface LessonsListProps {
    lessons: Lesson[]
    isLoading: boolean
    onTogglePaid: (lesson: Lesson) => void
    onToggleCancel: (lesson: Lesson) => void
    onEdit: (lesson: Lesson) => void
    onDelete: (lessonId: string) => void
}

export function LessonsList({
    lessons,
    isLoading,
    onTogglePaid,
    onToggleCancel,
    onEdit,
    onDelete
}: LessonsListProps) {
    if (isLoading) {
        return <div className={styles.loading}>Загрузка...</div>
    }

    if (lessons.length === 0) {
        return (
            <div className={styles.emptyState}>
                <BookIcon size={48} color="var(--text-tertiary)" />
                <p>Список занятий пуст</p>
            </div>
        )
    }

    return (
        <div className={styles.lessonsList}>
            {lessons.map((lesson) => (
                <LessonCard
                    key={lesson.id}
                    lesson={lesson}
                    onTogglePaid={onTogglePaid}
                    onToggleCancel={onToggleCancel}
                    onEdit={onEdit}
                    onDelete={onDelete}
                />
            ))}
        </div>
    )
}
