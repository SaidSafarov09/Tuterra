import React from 'react'
import { format, isPast } from 'date-fns'
import { MoneyIcon, ClockIcon, PlusIcon, CheckIcon, XCircleIcon, RescheduleIcon } from '@/components/icons/Icons'
import { Button } from '@/components/ui/Button'
import { Lesson, DayData } from '@/types'
import { LessonBadges } from '@/components/lessons/LessonBadges'
import { isTrial, isGroupLesson, isFullyPaidLesson, getLessonPaymentStatus } from '@/lib/lessonUtils'
import { getLessonTimeInfo, isLessonOngoing, isLessonPast } from '@/lib/lessonTimeUtils'
import styles from '../../app/(dashboard)/calendar/page.module.scss'
import { stringToColor } from '@/constants'
import { LessonLinkSection } from '@/components/lessons/LessonLinkSection'

import { getDayInfo, getRandomColor } from '@/lib/holidayUtils'

interface CalendarDayDetailsProps {
    date: Date | null
    dayData: DayData | null
    isLoading: boolean
    onAddLesson?: () => void
    onTogglePaid: (lesson: Lesson) => void
    onToggleCancel: (lesson: Lesson) => void
    onReschedule: (lesson: Lesson) => void
    userBirthDate?: string | null
    region?: string | null
    isStudentView?: boolean
    isLoadingAction?: boolean
}

export function CalendarDayDetails({
    date,
    dayData,
    isLoading,
    onAddLesson,
    onTogglePaid,
    onToggleCancel,
    onReschedule,
    userBirthDate,
    region,
    isStudentView,
    isLoadingAction = false
}: CalendarDayDetailsProps) {
    if (isLoading) {
        return <div className={styles.modalLoading}>Загрузка...</div>
    }

    const dayInfo = date ? getDayInfo(date, userBirthDate, region) : null
    const holidayGreeting = dayInfo?.holidayName || null
    const birthdayGreeting = dayInfo?.isBirthday ? `🎈🎉🎁 С днем рождения! 🎈🎉🎁` : null

    const isEmpty = !dayData || (!dayData.lessons?.length && dayData.totalEarned === 0 && dayData.potentialEarnings === 0)

    return (
        <div className={styles.dayDetails}>
            {(holidayGreeting || birthdayGreeting) && (
                <div className={styles.greetingContainer}>
                    {birthdayGreeting && (
                        <div className={styles.greetingText} style={{ color: getRandomColor() }}>
                            {birthdayGreeting}
                        </div>
                    )}
                    {holidayGreeting && (
                        <div className={styles.greetingText} style={{ color: getRandomColor(), marginTop: birthdayGreeting ? '8px' : '0' }}>
                            {holidayGreeting}
                        </div>
                    )}
                </div>
            )}

            {isEmpty && (
                <div className={styles.emptyDay}>
                    <ClockIcon size={48} color="var(--text-secondary)" />
                    <p>Нет занятий на этот день</p>
                    {!isStudentView && onAddLesson && (
                        <div style={{ marginTop: '16px' }}>
                            <Button onClick={onAddLesson} variant="secondary" size="small">
                                <PlusIcon size={16} />
                                Добавить занятие
                            </Button>
                        </div>
                    )}
                </div>
            )}

            {!isEmpty && (
                <>
                    {!isStudentView && (
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
                    )}

                    <div className={styles.lessonsContainer}>
                        <div className={styles.lessonsHeader}>
                            <h3 className={styles.lessonsTitle}>Занятия {dayData.lessons.length}</h3>
                            {!isStudentView && onAddLesson && (
                                <Button onClick={onAddLesson} size="small" variant="ghost" className={styles.addLessonButtonSmall}>
                                    <PlusIcon size={16} />
                                    Добавить
                                </Button>
                            )}
                        </div>

                        <div className={styles.lessonsScroll}>
                            {dayData.lessons.map(lesson => {
                                const isFullyPaid = isFullyPaidLesson(lesson)
                                const userHasPaid = isStudentView
                                    ? (lesson.userHasPaid ?? (lesson.group
                                        ? !!lesson.lessonPayments?.find(p => p.hasPaid)
                                        : lesson.isPaid))
                                    : lesson.isPaid

                                return (
                                    <div
                                        key={lesson.id}
                                        className={`${styles.lessonCard} ${lesson.isCanceled ? styles.lessonCanceled : ''}`}
                                    >
                                        <div className={styles.lessonMain}>
                                            <div className={styles.lessonInfo}>
                                                <div className={styles.lessonStudent}>
                                                    {isStudentView ? (
                                                        // Student sees group name if group lesson, else teacher name
                                                        lesson.group ? (
                                                            <><p style={{ color: stringToColor(lesson.group.name) }}>{lesson.group.name}&nbsp;<span style={{ color: 'var(--text-primary)' }}>- группа</span></p></>
                                                        ) : (
                                                            <>{lesson.owner?.name || lesson.owner?.firstName || 'Преподаватель'}</>
                                                        )
                                                    ) : (
                                                        // Teacher sees student/group name
                                                        lesson.group ? (
                                                            <><p style={{ color: stringToColor(lesson.group.name) }}>{lesson.group.name}&nbsp;<span style={{ color: 'var(--text-primary)' }}>- группа</span></p></>
                                                        ) : lesson.groupName ? (
                                                            <><p style={{ color: stringToColor(lesson.groupName) }}>{lesson.groupName}&nbsp;<span style={{ color: 'var(--text-primary)' }}>- группа</span></p></>
                                                        ) : (
                                                            <>{lesson.student?.name}</>
                                                        )
                                                    )}
                                                    {lesson.isCanceled && (
                                                        <span className={styles.canceledBadge}>Отменено</span>
                                                    )}
                                                </div>
                                                <div className={styles.lessonMeta}>
                                                    <span className={`${styles.metaPrice} ${lesson.price === 0 ? styles.priceFree : isFullyPaid ? styles.pricePaid : styles.priceUnpaid}`}>
                                                        {lesson.price === 0 ? 'Бесплатно' : (
                                                            <>
                                                                {isStudentView
                                                                    ? lesson.price
                                                                    : (lesson.group && lesson.lessonPayments
                                                                        ? lesson.lessonPayments.filter(p => p.hasPaid).length * lesson.price
                                                                        : lesson.price)} ₽
                                                            </>
                                                        )}
                                                    </span>
                                                    {lesson.subject && (
                                                        <span
                                                            className={styles.lessonSubject}
                                                            style={{
                                                                color: lesson.subject.color,
                                                                backgroundColor: lesson.subject.color + '15',
                                                                borderColor: lesson.subject.color + '30',
                                                            }}
                                                        >
                                                            {lesson.subject.name}
                                                        </span>
                                                    )}
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                        <span style={{ color: 'var(--text-secondary)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                            <ClockIcon size={12} />
                                                            {getLessonTimeInfo(new Date(lesson.date), lesson.duration)}
                                                        </span>
                                                        {isLessonOngoing(lesson.date, lesson.duration || 60) && (
                                                            <span style={{ color: 'var(--success)', fontSize: '12px', fontWeight: 500 }}>
                                                                Занятие началось
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            {lesson.notes && (
                                                <div className={styles.lessonNotes}>{lesson.notes}</div>
                                            )}

                                            <div className={styles.lessonTimeContainer}>
                                                <div className={styles.timeBig}>
                                                    {format(new Date(lesson.date), 'HH:mm')}
                                                </div>
                                                <LessonBadges
                                                    price={lesson.price}
                                                    isPaid={userHasPaid}
                                                    isTrial={lesson.isTrial}
                                                    isGroupLesson={!!lesson.group}
                                                    totalStudents={lesson.group?.students?.length || 0}
                                                    lessonPayments={lesson.lessonPayments}
                                                    isStudentView={isStudentView}
                                                />
                                            </div>
                                        </div>

                                        <LessonLinkSection
                                            lesson={lesson}
                                            isStudentView={isStudentView}
                                        />

                                        <div className={styles.lessonActions}>
                                            {!lesson.isCanceled && !isTrial(lesson.price) && !isStudentView && (
                                                <button
                                                    className={`${styles.actionButton} ${getLessonPaymentStatus(lesson) === 'paid' ? styles.isPaid : getLessonPaymentStatus(lesson) === 'partial' ? styles.isPartial : getLessonPaymentStatus(lesson) === 'unpaid' ? styles.isUnpaid : ''}`}
                                                    onClick={() => onTogglePaid(lesson)}
                                                    disabled={lesson.isCanceled}
                                                >
                                                    <CheckIcon size={16} />
                                                    {isGroupLesson(lesson) && !isFullyPaid ? 'Управлять' : (isFullyPaid ? (isGroupLesson(lesson) ? 'Изменить оплату' : 'Отменить оплату') : 'Отметить оплаченным')}
                                                </button>
                                            )}

                                            {!lesson.isCanceled && !isTrial(lesson.price) && isStudentView && (
                                                <button
                                                    className={`${styles.actionButton} ${styles.paidButton} ${userHasPaid ? styles.isPaid : styles.isUnpaid}`}
                                                    onClick={() => onTogglePaid(lesson)}
                                                    disabled={lesson.isCanceled || userHasPaid || isLoadingAction}
                                                >
                                                    <CheckIcon size={16} />
                                                    {userHasPaid ? 'Оплачено' : 'Я оплатил'}
                                                </button>
                                            )}

                                            {!isLessonPast(lesson.date, lesson.duration || 60) && (!isStudentView || !isGroupLesson(lesson)) && (
                                                <button
                                                    className={styles.actionButton}
                                                    onClick={() => onReschedule(lesson)}
                                                >
                                                    <RescheduleIcon size={16} />
                                                    {isStudentView ? 'Запрос на перенос' : 'Перенести'}
                                                </button>
                                            )}

                                            {!isLessonPast(lesson.date, lesson.duration || 60) && (!isStudentView || !isGroupLesson(lesson)) && (
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
                                                            {isStudentView ? 'Запрос на отмену' : 'Отменить'}
                                                        </>
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </>
            )
            }
        </div >
    )
}
