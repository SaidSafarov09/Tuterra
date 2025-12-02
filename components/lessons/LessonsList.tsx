import React from 'react'
import { BookIcon } from '@/components/icons/Icons'
import { Lesson } from '@/types'
import { LessonCard } from '@/components/ui/LessonCard'
import { LessonCardSkeleton } from '@/components/skeletons'
import styles from '../../app/(dashboard)/lessons/page.module.scss'

interface LessonsListProps {
    lessons: Lesson[]
    isLoading: boolean
    isRefreshing?: boolean
    onTogglePaid: (lesson: Lesson) => void
    onToggleCancel: (lesson: Lesson) => void
    onEdit: (lesson: Lesson) => void
    onDelete: (lessonId: string) => void
}

export function LessonsList({
    lessons,
    isLoading,
    isRefreshing = false,
    onTogglePaid,
    onToggleCancel,
    onEdit,
    onDelete
}: LessonsListProps) {
    if (isLoading) {
        return (
            <div className={styles.lessonsList}>
                <LessonCardSkeleton />
                <LessonCardSkeleton />
                <LessonCardSkeleton />
                <LessonCardSkeleton />
                <LessonCardSkeleton />
            </div>
        )
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
        <div className={`${styles.lessonsList} ${isRefreshing ? styles.refreshing : ''}`}>
            {lessons.map((lesson) => (
                <LessonCard
                    key={lesson.id}
                    lesson={lesson}
                    showActions={true}
                    onTogglePaid={onTogglePaid}
                    onToggleCancel={onToggleCancel}
                    onEdit={onEdit}
                    onDelete={onDelete}
                />
            ))}
        </div>
    )
}
