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
    onReschedule?: (lesson: Lesson) => void
    onEdit: (lesson: Lesson) => void
    onDelete: (lessonId: string) => void
    isStudentView?: boolean
    isActionLoading?: boolean
}

export function LessonsList({
    lessons,
    isLoading,
    isRefreshing = false,
    onTogglePaid,
    onToggleCancel,
    onReschedule,
    onEdit,
    onDelete,
    isStudentView = false,
    isActionLoading = false
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
            {lessons.map((lesson, index) => (
                <LessonCard
                    key={lesson.id}
                    lesson={lesson}
                    showActions={true}
                    onTogglePaid={onTogglePaid}
                    onToggleCancel={onToggleCancel}
                    onReschedule={onReschedule}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    index={index}
                    totalItems={lessons.length}
                    isStudentView={isStudentView}
                    isActionLoading={isActionLoading}
                />
            ))}
        </div>
    )
}
