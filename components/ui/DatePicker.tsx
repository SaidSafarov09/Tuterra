'use client'

import React, { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import styles from './DatePicker.module.scss'

interface DatePickerProps {
    value: Date | undefined
    onChange: (date: Date) => void
}

export const DatePicker: React.FC<DatePickerProps> = ({ value, onChange }) => {
    const currentDate = value || new Date()
    const [viewDate, setViewDate] = useState(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1))

    const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate()
    const firstDayOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay()
    const startingDayIndex = (firstDayOfMonth + 6) % 7

    const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
        'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь']
    const dayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

    const handleDateClick = (day: number) => {
        const newDate = new Date(currentDate)
        newDate.setFullYear(viewDate.getFullYear())
        newDate.setMonth(viewDate.getMonth())
        newDate.setDate(day)
        onChange(newDate)
    }

    const prevMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))
    const nextMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))

    const renderCalendarDays = () => {
        const days = []
        const today = new Date()

        for (let i = 0; i < startingDayIndex; i++) {
            days.push(<div key={`empty-${i}`} className={styles.emptyDay} />)
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const isSelected = value &&
                value.getDate() === day &&
                value.getMonth() === viewDate.getMonth() &&
                value.getFullYear() === viewDate.getFullYear()

            const isToday = today.getDate() === day &&
                today.getMonth() === viewDate.getMonth() &&
                today.getFullYear() === viewDate.getFullYear()

            days.push(
                <button
                    key={day}
                    type="button"
                    className={`${styles.day} ${isSelected ? styles.selected : ''} ${isToday ? styles.today : ''}`}
                    onClick={() => handleDateClick(day)}
                >
                    {day}
                </button>
            )
        }
        return days
    }

    return (
        <div className={styles.calendar}>
            <div className={styles.header}>
                <button type="button" onClick={prevMonth} className={styles.navButton}>
                    <ChevronLeft size={20} />
                </button>
                <div className={styles.monthYear}>
                    {monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}
                </div>
                <button type="button" onClick={nextMonth} className={styles.navButton}>
                    <ChevronRight size={20} />
                </button>
            </div>
            <div className={styles.weekdays}>
                {dayNames.map(day => (
                    <div key={day} className={styles.weekday}>{day}</div>
                ))}
            </div>
            <div className={styles.days}>
                {renderCalendarDays()}
            </div>
        </div>
    )
}
