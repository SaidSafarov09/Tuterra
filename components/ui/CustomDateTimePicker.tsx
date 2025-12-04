'use client'

import React, { useState } from 'react'
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react'
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
    const [selectedHour, setSelectedHour] = useState(currentDate.getHours())
    const [selectedMinute, setSelectedMinute] = useState(currentDate.getMinutes())

    const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate()
    const firstDayOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay()

    // Adjust for Monday start (0 = Sunday -> 6, 1 = Monday -> 0)
    const startingDayIndex = (firstDayOfMonth + 6) % 7

    const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
        'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь']
    const dayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

    const handleDateClick = (day: number) => {
        const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day, selectedHour, selectedMinute)
        onChange(newDate)
    }

    const handleTimeChange = (hour: number, minute: number) => {
        setSelectedHour(hour)
        setSelectedMinute(minute)
        if (value) {
            const newDate = new Date(value)
            newDate.setHours(hour, minute)
            onChange(newDate)
        }
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

        // Empty cells for days before month starts
        for (let i = 0; i < startingDayIndex; i++) {
            days.push(<div key={`empty-${i}`} className={styles.emptyDay} />)
        }

        // Days of the month
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

    const hours = Array.from({ length: 24 }, (_, i) => i)
    const minutes = [0, 15, 30, 45]

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
                <div className={styles.timeSelectors}>
                    <div className={styles.timeColumn}>
                        <div className={styles.timeLabel}>Часы</div>
                        <div className={styles.timeScroll}>
                            {hours.map(hour => (
                                <button
                                    key={hour}
                                    type="button"
                                    className={`${styles.timeOption} ${selectedHour === hour ? styles.selectedTime : ''}`}
                                    onClick={() => handleTimeChange(hour, selectedMinute)}
                                >
                                    {String(hour).padStart(2, '0')}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className={styles.timeSeparator}>:</div>
                    <div className={styles.timeColumn}>
                        <div className={styles.timeLabel}>Минуты</div>
                        <div className={styles.timeScroll}>
                            {minutes.map(minute => (
                                <button
                                    key={minute}
                                    type="button"
                                    className={`${styles.timeOption} ${selectedMinute === minute ? styles.selectedTime : ''}`}
                                    onClick={() => handleTimeChange(selectedHour, minute)}
                                >
                                    {String(minute).padStart(2, '0')}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
