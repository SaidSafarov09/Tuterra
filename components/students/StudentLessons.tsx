import React, { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { TabNav } from '@/components/ui/TabNav'
import { PlusIcon, NoteIcon } from '@/components/icons/Icons'
import { Lesson, Student, LessonFilter } from '@/types'
import { formatSmartDate } from '@/lib/dateUtils'
import { LESSON_TABS } from '@/constants'
import { LessonActions } from '@/components/lessons/LessonActions'
import { LessonBadges } from '@/components/lessons/LessonBadges'
import styles from '../../app/(dashboard)/students/[id]/page.module.scss'

interface StudentLessonsProps {
    lessons: Lesson[]
    student: Student
    onCreateLesson: () => void
    onEditLesson: (lesson: Lesson) => void
    onDeleteLesson: (lessonId: string) => void
    onTogglePaidStatus: (lessonId: string, isPaid: boolean) => void
    onToggleCancelLesson: (lessonId: string, isCanceled: boolean) => void
}

export function StudentLessons({
    lessons,
    student,
    onCreateLesson,
    onEditLesson,
    onDeleteLesson,
    onTogglePaidStatus,
    onToggleCancelLesson
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
                tabs={LESSON_TABS}
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
                                        <span className={styles.lessonPrice}>
                                            {lesson.price} ₽
                                        </span>
                                        <LessonBadges price={lesson.price} isPaid={lesson.isPaid} isTrial={lesson.isTrial} />
                                    </div>
                                </div>

                                <div onClick={(e) => e.stopPropagation()}>
                                    <LessonActions
                                        lesson={lesson}
                                        onTogglePaid={(l) => onTogglePaidStatus(l.id, !l.isPaid)}
                                        onToggleCancel={(l) => onToggleCancelLesson(l.id, !l.isCanceled)}
                                        onEdit={onEditLesson}
                                        onDelete={onDeleteLesson}
                                    />
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
