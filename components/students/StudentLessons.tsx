import React, { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { TabNav } from '@/components/ui/TabNav'
import { PlusIcon, EditIcon, DeleteIcon, CheckIcon, CloseIcon } from '@/components/icons/Icons'
import { Lesson, Student, LessonFilter } from '@/types'
import { formatSmartDate } from '@/lib/dateUtils'
import styles from '../../app/(dashboard)/students/[id]/page.module.scss'

const TABS = [
    { id: 'upcoming', label: 'Предстоящие' },
    { id: 'past', label: 'Прошедшие' },
    { id: 'unpaid', label: 'Неоплаченные' },
    { id: 'canceled', label: 'Отмененные' },
]

interface StudentLessonsProps {
    lessons: Lesson[]
    student: Student
    onCreateLesson: () => void
    onEditLesson: (lesson: Lesson) => void
    onDeleteLesson: (lessonId: string) => void
    onTogglePaidStatus: (lessonId: string, isPaid: boolean) => void
}

export function StudentLessons({
    lessons,
    student,
    onCreateLesson,
    onEditLesson,
    onDeleteLesson,
    onTogglePaidStatus
}: StudentLessonsProps) {
    const router = useRouter()
    const [activeTab, setActiveTab] = useState<LessonFilter>('upcoming')

    // Filter lessons based on active tab
    const filteredLessons = useMemo(() => {
        const now = new Date()

        switch (activeTab) {
            case 'upcoming':
                return lessons.filter(l => !l.isCanceled && new Date(l.date) >= now)
            case 'past':
                return lessons.filter(l => !l.isCanceled && new Date(l.date) < now)
            case 'unpaid':
                return lessons.filter(l => !l.isCanceled && !l.isPaid)
            case 'canceled':
                return lessons.filter(l => l.isCanceled)
            default:
                return lessons
        }
    }, [lessons, activeTab])

    return (
        <div className={styles.section}>
            <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>История занятий</h2>
                <Button variant="secondary" size="small" onClick={onCreateLesson}>
                    <PlusIcon size={16} />
                    Добавить
                </Button>
            </div>

            <TabNav
                tabs={TABS}
                activeTab={activeTab}
                onTabChange={(tab) => setActiveTab(tab as LessonFilter)}
            />

            {lessons.length === 0 ? (
                <div className={styles.emptyState}>
                    <p className={styles.emptyText}>У этого ученика пока нет занятий</p>
                    <Button onClick={onCreateLesson}>Создать первое занятие</Button>
                </div>
            ) : filteredLessons.length === 0 ? (
                <div className={styles.emptyState}>
                    <p className={styles.emptyText}>Нет занятий в этой категории</p>
                </div>
            ) : (
                <div className={styles.lessonsList}>
                    {filteredLessons.map((lesson) => {
                        const subject = lesson.subject
                        return (
                            <div
                                key={lesson.id}
                                className={styles.lessonCard}
                                onClick={() => router.push(`/lessons/${lesson.id}`)}
                            >
                                <div className={styles.lessonHeader}>
                                    <div>
                                        <h3 className={styles.lessonDate}>
                                            {formatSmartDate(new Date(lesson.date))}
                                        </h3>
                                        <span className={styles.lessonSubject}>
                                            {subject?.name || 'Без предмета'}
                                        </span>
                                    </div>
                                    <div className={styles.lessonPriceContainer}>
                                        <span className={styles.lessonPrice}>
                                            {lesson.price} ₽
                                        </span>
                                        <span
                                            className={`${styles.badge} ${lesson.isPaid ? styles.badgePaid : styles.badgeUnpaid
                                                }`}
                                        >
                                            {lesson.isPaid ? 'Оплачено' : 'Не оплачено'}
                                        </span>
                                    </div>
                                </div>

                                <div className={styles.lessonActions} onClick={(e) => e.stopPropagation()}>
                                    <button
                                        className={styles.actionButton}
                                        onClick={() => onTogglePaidStatus(lesson.id, !lesson.isPaid)}
                                    >
                                        {lesson.isPaid ? (
                                            <>
                                                <CloseIcon size={14} /> Отменить оплату
                                            </>
                                        ) : (
                                            <>
                                                <CheckIcon size={14} /> Отметить оплату
                                            </>
                                        )}
                                    </button>
                                    <button
                                        className={styles.actionButton}
                                        onClick={() => onEditLesson(lesson)}
                                    >
                                        <EditIcon size={14} /> Редактировать
                                    </button>
                                    <button
                                        className={`${styles.actionButton} ${styles.deleteButton}`}
                                        onClick={() => onDeleteLesson(lesson.id)}
                                    >
                                        <DeleteIcon size={14} /> Удалить
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
