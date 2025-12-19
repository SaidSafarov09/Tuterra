import React from 'react'
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    addDays,
    isSameMonth,
    isSameDay,
} from 'date-fns'
import { ru } from 'date-fns/locale'
import { Lesson } from '@/types'
import { getDayInfo } from '@/lib/holidayUtils'
import styles from '../../app/(dashboard)/calendar/page.module.scss'

interface CalendarGridProps {
    currentMonth: Date
    lessons: Lesson[]
    onDateClick: (date: Date) => void
    userBirthDate?: string | null
    region?: string | null
}

export function CalendarGrid({ currentMonth, lessons, onDateClick, userBirthDate, region }: CalendarGridProps) {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(monthStart)
    const startDate = startOfWeek(monthStart, { locale: ru })
    const endDate = endOfWeek(monthEnd, { locale: ru })

    const rows = []
    let days = []
    let day = startDate
    const dateFormat = 'd'

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

            const dayInfo = getDayInfo(cloneDay, userBirthDate, region)

            days.push(
                <div
                    key={day.toString()}
                    className={`
                        ${styles.calendarDay} 
                        ${!isSameMonth(day, monthStart) ? styles.disabled : ''} 
                        ${isSameDay(day, new Date()) ? styles.today : ''} 
                        ${hasLessons ? styles.hasLessons : ''}
                        ${dayInfo.isHoliday ? styles.holiday : ''}
                        ${dayInfo.isShortened ? styles.shortened : ''}
                        ${dayInfo.isBirthday ? styles.birthday : ''}
                    `}
                    onClick={() => onDateClick(cloneDay)}
                >
                    <span className={styles.dayNumber}>{format(day, dateFormat)}</span>
                    {hasLessons && (
                        <>
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
                            <div className={styles.mobileIndicator} />
                        </>
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
