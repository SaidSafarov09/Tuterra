import React from 'react'
import { format, isPast } from 'date-fns'
import { MoneyIcon, ClockIcon, PlusIcon, CheckIcon, XCircleIcon } from '@/components/icons/Icons'
import { Button } from '@/components/ui/Button'
import { Lesson, DayData } from '@/types'
import { LessonStatusBadge } from '@/components/lessons/LessonStatusBadge'
import { isTrial } from '@/lib/lessonUtils'
import styles from '../../app/(dashboard)/calendar/page.module.scss'

interface CalendarDayDetailsProps {
    date: Date | null
    dayData: DayData | null
    isLoading: boolean
    onAddLesson: () => void
    onTogglePaid: (lesson: Lesson) => void
    onToggleCancel: (lesson: Lesson) => void
}

export function CalendarDayDetails({
    date,
    dayData,
    isLoading,
    onAddLesson,
    onTogglePaid,
    onToggleCancel
}: CalendarDayDetailsProps) {
    if (isLoading) {
        return <div className={styles.modalLoading}>Загрузка...</div>
    }

    if (!dayData || (!dayData.lessons?.length && dayData.totalEarned === 0 && dayData.potentialEarnings === 0)) {
        return (
            <div className={styles.emptyDay}>
                <ClockIcon size={48} color="var(--text-secondary)" />
                <p>Нет занятий на этот день</p>
                <div style={{ marginTop: '16px' }}>
                    <Button onClick={onAddLesson} variant="secondary" size="small">
                        <PlusIcon size={16} />
                        Добавить занятие
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className={styles.dayDetails}>
            <div className={styles.dayStats}>
                {date && isPast(date) ? (
                    <div className={styles.statCard}>
                        <MoneyIcon size={24} color="#10B981" />
                        <div>
                            <div className={styles.statLabel}>Заработано</div>
                            <div className={styles.statValue}>{dayData.totalEarned} ₽</div>
                        </div>
                    </div>
                ) : (
                    <div className={styles.statCard}>
                        <MoneyIcon size={24} color="#6366f1" />
                        <div>
                            <div className={styles.statLabel}>Возможный заработок</div>
                            <div className={styles.statValue}>
                                {dayData.totalEarned + dayData.potentialEarnings} ₽
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className={styles.lessonsContainer}>
                <div className={styles.lessonsHeader}>
                    <h3 className={styles.lessonsTitle}>Занятия {dayData.lessons.length}</h3>
                    <Button onClick={onAddLesson} size="small" variant="ghost" className={styles.addLessonButtonSmall}>
                        <PlusIcon size={16} />
                        Добавить
                    </Button>
                </div>

                <div className={styles.lessonsScroll}>
                    {dayData.lessons.map(lesson => (
                        <div
                            key={lesson.id}
                            className={`${styles.lessonCard} ${lesson.isCanceled ? styles.lessonCanceled : ''}`}
                        >
                            <div className={styles.lessonMain}>
                                <div className={styles.lessonInfo}>
                                    <div className={styles.lessonStudent}>
                                        {lesson.student.name}
                                        {lesson.isCanceled && (
                                            <span className={styles.canceledBadge}>Отменено</span>
                                        )}
                                    </div>
                                    <div className={styles.lessonMeta}>
                                        <span className={`${styles.metaPrice} ${lesson.isPaid ? styles.pricePaid : styles.priceUnpaid}`}>
                                            {lesson.price} ₽
                                        </span>
                                        {lesson.subject && (
                                            <span
                                                className={styles.lessonSubject}
                                                style={{
                                                    color: lesson.subject.color,
                                                    backgroundColor: `${lesson.subject.color}20`
                                                }}
                                            >
                                                {lesson.subject.name}
                                            </span>
                                        )}
                                    </div>
                                    {lesson.notes && (
                                        <div className={styles.lessonNotes}>{lesson.notes}</div>
                                    )}
                                </div>
                                <div className={styles.lessonTimeContainer}>
                                    <div className={styles.timeBig}>
                                        {format(new Date(lesson.date), 'HH:mm')}
                                    </div>
                                    <LessonStatusBadge price={lesson.price} isPaid={lesson.isPaid} />
                                </div>
                            </div>

                            <div className={styles.lessonActions}>
                                {!lesson.isCanceled && !isTrial(lesson.price) && (
                                    <button
                                        className={styles.actionButton}
                                        onClick={() => onTogglePaid(lesson)}
                                        disabled={lesson.isCanceled}
                                    >
                                        <CheckIcon size={16} />
                                        {lesson.isPaid ? 'Отменить оплату' : 'Отметить оплаченным'}
                                    </button>
                                )}

                                {!isPast(new Date(lesson.date)) && (
                                    <button
                                        className={`${styles.actionButton} ${lesson.isCanceled ? styles.restoreButton : styles.deleteButton}`}
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
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
