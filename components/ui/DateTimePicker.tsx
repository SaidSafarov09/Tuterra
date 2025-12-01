'use client'

import React, { useState, useRef, useEffect } from 'react'
import styles from './DateTimePicker.module.scss'
import { CalendarIcon, ClockIcon, ArrowLeftIcon, ArrowRightIcon } from '@/components/icons/Icons'
import { Button } from './Button'
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday } from 'date-fns'
import { ru } from 'date-fns/locale'

interface DateTimePickerProps {
    label?: string
    value?: Date
    onChange: (date: Date) => void
    minDate?: Date
    maxDate?: Date
    showTime?: boolean
    timeOnly?: boolean // Показывать только выбор времени, без календаря
    disabled?: boolean
    required?: boolean
    error?: string
    placeholder?: string
    dropDirection?: 'up' | 'down' | 'center'
}

export const DateTimePicker: React.FC<DateTimePickerProps> = ({
    label,
    value,
    onChange,
    minDate,
    maxDate,
    showTime = true,
    timeOnly = false,
    disabled = false,
    required = false,
    error,
    placeholder = 'Выберите дату и время',
    dropDirection = 'center',
}) => {
    const [isOpen, setIsOpen] = useState(false)
    const [currentMonth, setCurrentMonth] = useState(value || new Date())
    const [hours, setHours] = useState(value ? format(value, 'HH') : '12')
    const [minutes, setMinutes] = useState(value ? format(value, 'mm') : '00')
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside)
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [isOpen])

    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

    // Добавляем дни из предыдущего и следующего месяцев для заполнения строк
    const firstDayOfWeek = monthStart.getDay()
    const adjustedFirstDay = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1

    const previousMonthDays = adjustedFirstDay > 0
        ? eachDayOfInterval({
            start: subMonths(monthStart, 1),
            end: addMonths(subMonths(monthStart, 1), 0),
        }).slice(-adjustedFirstDay)
        : []

    const allDays = [...previousMonthDays, ...days]
    const remainingDays = 42 - allDays.length
    const nextMonthDays = remainingDays > 0
        ? eachDayOfInterval({
            start: addMonths(monthEnd, 1),
            end: addMonths(monthEnd, 1),
        }).slice(0, remainingDays)
        : []

    const calendarDays = [...allDays, ...nextMonthDays]

    const handleDayClick = (day: Date) => {
        const newDate = new Date(day)
        newDate.setHours(parseInt(hours), parseInt(minutes))
        onChange(newDate)
        if (!showTime) {
            setIsOpen(false)
        }
    }

    const handleTimeChange = () => {
        if (value) {
            const newDate = new Date(value)
            newDate.setHours(parseInt(hours), parseInt(minutes))
            onChange(newDate)
        }
    }

    const handleConfirm = () => {
        if (value) {
            const newDate = new Date(value)
            newDate.setHours(parseInt(hours), parseInt(minutes))
            onChange(newDate)
        }
        setIsOpen(false)
    }

    const isDayDisabled = (day: Date) => {
        if (minDate && day < minDate) return true
        if (maxDate && day > maxDate) return true
        return false
    }

    return (
        <div className={styles.container} ref={containerRef}>
            {label && (
                <label className={styles.label}>
                    {label}
                    {required && <span className={styles.required}>*</span>}
                </label>
            )}

            <div
                className={`${styles.input} ${isOpen ? styles.focused : ''} ${error ? styles.error : ''
                    } ${disabled ? styles.disabled : ''}`}
                onClick={() => !disabled && setIsOpen(!isOpen)}
            >
                <span className={styles.icon}>
                    {timeOnly ? <ClockIcon size={18} /> : <CalendarIcon size={18} />}
                </span>
                <span className={value ? styles.value : styles.placeholder}>
                    {value
                        ? format(
                            value,
                            timeOnly ? 'HH:mm' : (showTime ? 'dd MMMM yyyy, HH:mm' : 'dd MMMM yyyy'),
                            { locale: ru }
                        )
                        : placeholder}
                </span>
                {showTime && !timeOnly && (
                    <span className={styles.icon}>
                        <ClockIcon size={18} />
                    </span>
                )}
            </div>

            {isOpen && (
                <div className={`${styles.picker} ${dropDirection === 'center' ? styles.pickerCenter : ''} ${timeOnly ? styles.timeOnlyPicker : ''}`}>
                    {!timeOnly && (
                        <>
                            <div className={styles.header}>
                                <button
                                    className={styles.navButton}
                                    onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                                >
                                    <ArrowLeftIcon size={16} />
                                </button>
                                <span className={styles.monthYear}>
                                    {format(currentMonth, 'LLLL yyyy', { locale: ru })}
                                </span>
                                <button
                                    className={styles.navButton}
                                    onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                                >
                                    <ArrowRightIcon size={16} />
                                </button>
                            </div>

                            <div className={styles.weekdays}>
                                {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((day) => (
                                    <div key={day} className={styles.weekday}>
                                        {day}
                                    </div>
                                ))}
                            </div>

                            <div className={styles.days}>
                                {calendarDays.map((day, index) => (
                                    <button
                                        key={index}
                                        className={`${styles.day} ${!isSameMonth(day, currentMonth) ? styles.otherMonth : ''
                                            } ${value && isSameDay(day, value) ? styles.selected : ''} ${isToday(day) ? styles.today : ''
                                            } ${isDayDisabled(day) ? styles.disabled : ''}`}
                                        onClick={() => !isDayDisabled(day) && handleDayClick(day)}
                                        disabled={isDayDisabled(day)}
                                    >
                                        {format(day, 'd')}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}

                    {(showTime || timeOnly) && (
                        <div className={styles.timePicker}>
                            <div className={styles.timeLabel}>Время</div>
                            <div className={styles.timeInputs}>
                                <input
                                    type="number"
                                    className={styles.timeInput}
                                    value={hours}
                                    onChange={(e) => {
                                        const val = Math.max(0, Math.min(23, parseInt(e.target.value) || 0))
                                        setHours(val.toString().padStart(2, '0'))
                                        handleTimeChange()
                                    }}
                                    min="0"
                                    max="23"
                                />
                                <span className={styles.timeSeparator}>:</span>
                                <input
                                    type="number"
                                    className={styles.timeInput}
                                    value={minutes}
                                    onChange={(e) => {
                                        const val = Math.max(0, Math.min(59, parseInt(e.target.value) || 0))
                                        setMinutes(val.toString().padStart(2, '0'))
                                        handleTimeChange()
                                    }}
                                    min="0"
                                    max="59"
                                />
                            </div>
                        </div>
                    )}

                    <div className={styles.footer}>
                        <Button variant="ghost" size="small" fullWidth onClick={() => setIsOpen(false)}>
                            Отмена
                        </Button>
                        <Button size="small" fullWidth onClick={handleConfirm}>
                            Готово
                        </Button>
                    </div>
                </div>
            )}

            {error && <div className={styles.errorMessage}>{error}</div>}
        </div>
    )
}
