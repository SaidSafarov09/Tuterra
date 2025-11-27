'use client'

import React, { useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
    ChevronLeftIcon,
    ChevronRightIcon,
    CalendarIcon,
    ClockIcon,
    MoneyIcon,
    DeleteIcon,
    CheckIcon
} from '@/components/icons/Icons'
import { Modal } from '@/components/ui/Modal'
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    addDays,
    addMonths,
    subMonths,
    isSameMonth,
    isSameDay,
    isToday,
    isPast,
    isFuture
} from 'date-fns'
import { ru } from 'date-fns/locale'
import { formatSmartDate } from '@/lib/dateUtils'
import styles from './page.module.scss'

interface Lesson {
    id: string
    date: string
    price: number
    isPaid: boolean
    notes?: string
    student: {
        id: string
        name: string
    }
    subject?: {
        id: string
        name: string
        color: string
    } | null
}

interface DayData {
    lessons: Lesson[]
    totalEarned: number
    potentialEarnings: number
}

export default function CalendarPage() {
    const [currentMonth, setCurrentMonth] = useState(new Date())
    const [selectedDate, setSelectedDate] = useState<Date | null>(null)
    const [dayData, setDayData] = useState<DayData | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isLoadingDay, setIsLoadingDay] = useState(false)
    const [lessons, setLessons] = useState<Lesson[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        fetchLessons()
    }, [currentMonth])

    const fetchLessons = async () => {
        setIsLoading(true)
        try {
            const response = await fetch('/api/lessons')
            if (response.ok) {
                const data = await response.json()
                setLessons(data)
            } else {
                toast.error('Не удалось загрузить занятия')
            }
        } catch (error) {
            toast.error('Произошла ошибка при загрузке')
        } finally {
            setIsLoading(false)
        }
    }

    const handleDateClick = (date: Date) => {
        setSelectedDate(date)
        loadDayData(date)
        setIsModalOpen(true)
    }

    const loadDayData = (date: Date) => {
        setIsLoadingDay(true)

        const dayLessons = lessons.filter(lesson =>
            isSameDay(new Date(lesson.date), date)
        )

        const totalEarned = dayLessons
            .filter(l => l.isPaid)
            .reduce((sum, l) => sum + l.price, 0)

        const potentialEarnings = dayLessons
            .filter(l => !l.isPaid)
            .reduce((sum, l) => sum + l.price, 0)

        setDayData({
            lessons: dayLessons,
            totalEarned,
            potentialEarnings
        })
        setIsLoadingDay(false)
    }

    const handleCancelLesson = async (lessonId: string) => {
        if (!confirm('Вы уверены, что хотите отменить это занятие?')) {
            return
        }

        try {
            const response = await fetch(`/api/lessons/${lessonId}`, {
                method: 'DELETE'
            })

            if (response.ok) {
                toast.success('Занятие отменено')
                await fetchLessons()
                if (selectedDate) {
                    loadDayData(selectedDate)
                }
            } else {
                toast.error('Не удалось отменить занятие')
            }
        } catch (error) {
            toast.error('Произошла ошибка')
        }
    }

    const handleTogglePaid = async (lesson: Lesson) => {
        try {
            const response = await fetch(`/api/lessons/${lesson.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isPaid: !lesson.isPaid })
            })

            if (response.ok) {
                toast.success(lesson.isPaid ? 'Отмечено как неоплаченное' : 'Отмечено как оплаченное')
                await fetchLessons()
                if (selectedDate) {
                    loadDayData(selectedDate)
                }
            }
        } catch (error) {
            toast.error('Произошла ошибка')
        }
    }

    const renderCalendar = () => {
        const monthStart = startOfMonth(currentMonth)
        const monthEnd = endOfMonth(monthStart)
        const startDate = startOfWeek(monthStart, { locale: ru })
        const endDate = endOfWeek(monthEnd, { locale: ru })

        const dateFormat = 'd'
        const rows = []
        let days = []
        let day = startDate

        while (day <= endDate) {
            for (let i = 0; i < 7; i++) {
                const cloneDay = day
                const dayLessons = lessons.filter(lesson =>
                    isSameDay(new Date(lesson.date), cloneDay)
                )
                const hasLessons = dayLessons.length > 0
                const dayEarnings = dayLessons
                    .filter(l => l.isPaid)
                    .reduce((sum, l) => sum + l.price, 0)

                days.push(
                    <div
                        key={day.toString()}
                        className={`${styles.calendarDay} ${!isSameMonth(day, monthStart) ? styles.disabled : ''
                            } ${isSameDay(day, new Date()) ? styles.today : ''} ${hasLessons ? styles.hasLessons : ''
                            }`}
                        onClick={() => handleDateClick(cloneDay)}
                    >
                        <span className={styles.dayNumber}>{format(day, dateFormat)}</span>
                        {hasLessons && (
                            <div className={styles.dayIndicators}>
                                <div className={styles.subjectDots}>
                                    {dayLessons.slice(0, 4).map((lesson, idx) => (
                                        <div
                                            key={idx}
                                            className={styles.subjectDot}
                                            style={{ backgroundColor: lesson.subject?.color || 'var(--primary)' }}
                                        />
                                    ))}
                                    {dayLessons.length > 4 && (
                                        <div className={styles.moreDots}>+</div>
                                    )}
                                </div>
                                {dayEarnings > 0 && (
                                    <div className={styles.earnings}>+{dayEarnings}₽</div>
                                )}
                            </div>
                        )}
                    </div>
                )
                day = addDays(day, 1)
            }
            rows.push(
                <div className={styles.calendarWeek} key={day.toString()}>
                    {days}
                </div>
            )
            days = []
        }
        return <div className={styles.calendarBody}>{rows}</div>
    }

    const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

    if (isLoading) {
        return <div className={styles.loading}>Загрузка...</div>
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.headerText}>
                    <h1 className={styles.title}>Календарь</h1>
                    <p className={styles.subtitle}>Планирование занятий</p>
                </div>
            </div>

            <div className={styles.calendarContainer}>
                <div className={styles.calendarHeader}>
                    <button
                        className={styles.navButton}
                        onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                    >
                        <ChevronLeftIcon size={20} />
                    </button>
                    <h2 className={styles.monthTitle}>
                        {format(currentMonth, 'LLLL yyyy', { locale: ru })}
                    </h2>
                    <button
                        className={styles.navButton}
                        onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                    >
                        <ChevronRightIcon size={20} />
                    </button>
                </div>

                <div className={styles.calendarWeekDays}>
                    {weekDays.map(day => (
                        <div key={day} className={styles.weekDay}>
                            {day}
                        </div>
                    ))}
                </div>

                {renderCalendar()}
            </div>

            {/* Day Details Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={selectedDate ? format(selectedDate, 'd MMMM yyyy', { locale: ru }) : ''}
            >
                {isLoadingDay ? (
                    <div className={styles.modalLoading}>Загрузка...</div>
                ) : dayData && dayData.lessons.length > 0 ? (
                    <div className={styles.dayDetails}>
                        <div className={styles.dayStats}>
                            {selectedDate && isPast(selectedDate) ? (
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

                        <div className={styles.lessonsList}>
                            <h3 className={styles.lessonsTitle}>Занятия ({dayData.lessons.length})</h3>
                            {dayData.lessons.map(lesson => (
                                <div key={lesson.id} className={styles.lessonCard}>
                                    <div className={styles.lessonMain}>
                                        <div className={styles.lessonInfo}>
                                            <div className={styles.lessonStudent}>
                                                {lesson.student.name}
                                            </div>
                                            <div className={styles.lessonMeta}>
                                                <ClockIcon size={14} />
                                                {format(new Date(lesson.date), 'HH:mm')}
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
                                        <div className={styles.lessonPrice}>
                                            <div className={`${styles.price} ${lesson.isPaid ? styles.pricePaid : styles.priceUnpaid}`}>
                                                {lesson.price} ₽
                                            </div>
                                            {lesson.isPaid && (
                                                <span className={styles.paidBadge}>Оплачено</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className={styles.lessonActions}>
                                        {selectedDate && isFuture(selectedDate) && (
                                            <>
                                                <button
                                                    className={styles.actionButton}
                                                    onClick={() => handleTogglePaid(lesson)}
                                                >
                                                    <CheckIcon size={16} />
                                                    {lesson.isPaid ? 'Отменить оплату' : 'Отметить оплаченным'}
                                                </button>
                                                <button
                                                    className={`${styles.actionButton} ${styles.deleteButton}`}
                                                    onClick={() => handleCancelLesson(lesson.id)}
                                                >
                                                    <DeleteIcon size={16} />
                                                    Отменить занятие
                                                </button>
                                            </>
                                        )}
                                        {selectedDate && isPast(selectedDate) && !lesson.isPaid && (
                                            <button
                                                className={styles.actionButton}
                                                onClick={() => handleTogglePaid(lesson)}
                                            >
                                                <CheckIcon size={16} />
                                                Отметить оплаченным
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className={styles.emptyDay}>
                        <CalendarIcon size={48} color="#9CA3AF" />
                        <p>Нет занятий на этот день</p>
                    </div>
                )}
            </Modal>
        </div>
    )
}
