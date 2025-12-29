import React, { useState } from 'react'
import Link from 'next/link'
import { Lesson } from '@/types'
import { formatSmartDate } from '@/lib/dateUtils'
import { ClockIcon, NoteIcon } from '@/components/icons/Icons'
import { Repeat } from 'lucide-react'
import { LessonBadges } from '@/components/lessons/LessonBadges'
import { LessonActions } from '@/components/lessons/LessonActions'
import { getRecurrenceDescription } from '@/lib/recurring-lessons'
import { getLessonTimeInfo, isLessonOngoing } from '@/lib/lessonTimeUtils'
import styles from './LessonCard.module.scss'
import { stringToColor } from '@/lib/utils'

interface LessonCardProps {
    lesson: Lesson & { series?: any }
    variant?: 'default' | 'compact'
    showActions?: boolean
    onTogglePaid?: (lesson: Lesson) => void
    onToggleCancel?: (lesson: Lesson) => void
    onReschedule?: (lesson: Lesson) => void
    onEdit?: (lesson: Lesson) => void
    onDelete?: (lessonId: string) => void
    index?: number
    totalItems?: number
    isStudentView?: boolean
}

export const LessonCard: React.FC<LessonCardProps> = ({
    lesson,
    variant = 'default',
    showActions = false,
    onTogglePaid,
    onToggleCancel,
    onReschedule,
    onEdit,
    onDelete,
    index,
    totalItems,
    isStudentView = false,
}) => {
    const [showTopic, setShowTopic] = useState(false)

    // Определяем, полностью ли оплачен урок
    const isFullyPaid = isStudentView
        ? (lesson.group
            ? !!lesson.lessonPayments?.find(p => p.hasPaid)
            : lesson.isPaid)
        : (lesson.group
            ? (lesson.lessonPayments?.filter(p => p.hasPaid).length === lesson.group.students?.length && (lesson.group.students?.length || 0) > 0)
            : lesson.isPaid)

    const recurrenceText = lesson.series ? getRecurrenceDescription(
        {
            enabled: true,
            type: lesson.series.type,
            interval: lesson.series.interval,
            daysOfWeek: typeof lesson.series.daysOfWeek === 'string'
                ? JSON.parse(lesson.series.daysOfWeek || '[]')
                : lesson.series.daysOfWeek,
            endType: lesson.series.endDate ? 'until_date' : lesson.series.occurrencesCount ? 'count' : 'never',
            endDate: lesson.series.endDate,
            occurrencesCount: lesson.series.occurrencesCount,
        },
        new Date(lesson.date)
    ) : null

    const CardContent = (
        <div className={`${styles.card} ${variant === 'compact' ? styles.compact : ''} ${lesson.isCanceled ? styles.canceled : ''}`}>
            <div className={styles.header}>
                <div className={styles.info}>
                    <h4 className={styles.studentName}>
                        {isStudentView
                            ? (lesson.owner?.name || lesson.owner?.firstName || 'Преподаватель')
                            : (lesson.student?.name || (lesson.group ? (
                                <><span style={{ color: stringToColor(lesson.group.name) }}>{lesson.group.name}</span> — группа</>
                            ) : lesson.groupName ? (
                                <><span style={{ color: stringToColor(lesson.groupName) }}>{lesson.groupName}</span> — группа</>
                            ) : null))}
                    </h4>
                    {(lesson.subject || (lesson.subjectName && lesson.subjectColor)) && (
                        <span
                            className={styles.subjectBadge}
                            style={{
                                color: lesson.subject?.color || lesson.subjectColor || '#666',
                                backgroundColor: (lesson.subject?.color || lesson.subjectColor || '#666') + '15',
                                borderColor: (lesson.subject?.color || lesson.subjectColor || '#666') + '30',
                            }}
                        >
                            {lesson.subject?.name || lesson.subjectName}
                        </span>
                    )}
                    <div className={styles.dateBlock}>
                        <p className={styles.date}>
                            <ClockIcon size={14} color="var(--text-secondary)" />
                            {formatSmartDate(lesson.date)}
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span className={styles.duration}>
                                {getLessonTimeInfo(new Date(lesson.date), lesson.duration)}
                            </span>
                            {isLessonOngoing(lesson.date, lesson.duration || 60) && (
                                <span style={{ color: 'var(--success)', fontSize: '12px', fontWeight: 500 }}>
                                    Занятие началось
                                </span>
                            )}
                        </div>
                    </div>
                    {recurrenceText && (
                        <p className={styles.recurrence}>
                            <Repeat size={14} />
                            {recurrenceText}
                        </p>
                    )}
                    {lesson.topic && (
                        <div
                            className={styles.topicTrigger}
                            onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                setShowTopic(!showTopic)
                            }}
                        >
                            <span className={styles.topicLabel}>Тема урока:</span>
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
                        className={`${styles.price} ${isFullyPaid ? styles.pricePaid : styles.priceUnpaid}`}
                    >
                        {isStudentView
                            ? lesson.price
                            : (lesson.group && lesson.lessonPayments
                                ? lesson.lessonPayments.filter(p => p.hasPaid).length * lesson.price
                                : lesson.price)} ₽
                    </div>
                    <LessonBadges
                        price={lesson.price}
                        isPaid={lesson.isPaid}
                        isTrial={lesson.isTrial}
                        isGroupLesson={!!lesson.group}
                        totalStudents={lesson.group?.students?.length || 0}
                        lessonPayments={lesson.lessonPayments}
                        isStudentView={isStudentView}
                    />
                </div>
            </div>
        </div>
    )

    if (showActions) {
        return (
            <div className={styles.cardWrapper}>
                <Link href={`${isStudentView ? '/student' : ''}/lessons/${lesson.slug || lesson.id}`} style={{ textDecoration: 'none', display: 'block' }}>
                    {CardContent}
                </Link>
                {onTogglePaid && (
                    <div className={styles.actionsFooter} onClick={(e) => e.stopPropagation()}>
                        <LessonActions
                            lesson={lesson}
                            onTogglePaid={onTogglePaid}
                            onToggleCancel={onToggleCancel}
                            onReschedule={onReschedule}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            index={index}
                            totalItems={totalItems}
                            isStudentView={isStudentView}
                        />
                    </div>
                )}
            </div>
        )
    }

    return (
        <Link href={`${isStudentView ? '/student' : ''}/lessons/${lesson.slug || lesson.id}`} style={{ textDecoration: 'none', display: 'block' }}>
            {CardContent}
        </Link>
    )
}
