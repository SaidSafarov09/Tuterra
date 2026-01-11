'use client'

import React, { useState } from 'react'
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react'
import { TimeInput } from './TimeInput'
import styles from './CustomDateTimePicker.module.scss'

interface CustomDateTimePickerProps {
    value: Date | undefined
    onChange: (date: Date) => void
}

export const CustomDateTimePicker: React.FC<CustomDateTimePickerProps> = ({
    value,
    onChange,
}) => {
    const currentDate = value || new Date()
    const [viewDate, setViewDate] = useState(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1))

    // Sync state with value prop when it changes (e.g. when modal reopens)
    React.useEffect(() => {
        if (value) {
            setViewDate(new Date(value.getFullYear(), value.getMonth(), 1))
        }
    }, [value])

    const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate()
    const firstDayOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay()
    const startingDayIndex = (firstDayOfMonth + 6) % 7

    const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
        'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь']
    const dayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

    const handleDateClick = (day: number) => {
        const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day)
        if (value) {
            newDate.setHours(value.getHours())
            newDate.setMinutes(value.getMinutes())
        } else {
            newDate.setHours(new Date().getHours())
            newDate.setMinutes(new Date().getMinutes())
        }
        onChange(newDate)
    }

    const handleTimeChange = (timeString: string) => {
        const [hours, minutes] = timeString.split(':').map(Number)
        const newDate = value ? new Date(value) : new Date()
        newDate.setHours(hours || 0)
        newDate.setMinutes(minutes || 0)
        newDate.setSeconds(0)
        newDate.setMilliseconds(0)
        onChange(newDate)
    }

    const prevMonth = () => {
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))
    }

    const nextMonth = () => {
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))
    }

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

    const currentTimeString = value
        ? `${String(value.getHours()).padStart(2, '0')}:${String(value.getMinutes()).padStart(2, '0')}`
        : '00:00'

    return (
        <div className={styles.picker}>
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

            <div className={styles.timePicker}>
                <div className={styles.timeHeader}>
                    <Clock size={16} />
                    <span>Время</span>
                </div>
                <div className={styles.timeInputSection}>
                    <TimeInput
                        value={currentTimeString}
                        onChange={handleTimeChange}
                    />
                    <div className={styles.timeHint}>
                        Введите время
                    </div>
                </div>
            </div>
        </div>
    )
}
