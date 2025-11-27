'use client'

import React, { useState } from 'react'
import { DayPicker } from 'react-day-picker'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { ClockIcon, CloseIcon } from '@/components/icons/Icons'
import styles from './Calendar.module.scss'
import 'react-day-picker/dist/style.css'

interface CalendarProps {
    value?: Date
    onChange?: (date: Date) => void
    onClose?: () => void
    showTime?: boolean
    minDate?: Date
    maxDate?: Date
}

export const Calendar: React.FC<CalendarProps> = ({
    value,
    onChange,
    onClose,
    showTime = true,
    minDate,
    maxDate,
}) => {
    const [selectedDate, setSelectedDate] = useState<Date>(value || new Date())
    const [hours, setHours] = useState(value ? value.getHours() : 12)
    const [minutes, setMinutes] = useState(value ? value.getMinutes() : 0)

    const handleDateSelect = (date: Date | undefined) => {
        if (date) {
            const newDate = new Date(date)
            newDate.setHours(hours)
            newDate.setMinutes(minutes)
            setSelectedDate(newDate)
            if (!showTime) {
                onChange?.(newDate)
                onClose?.()
            }
        }
    }

    const handleHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value)
        if (value >= 0 && value <= 23) {
            setHours(value)
        }
    }

    const handleMinutesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value)
        if (value >= 0 && value <= 59) {
            setMinutes(value)
        }
    }

    const handleConfirm = () => {
        const finalDate = new Date(selectedDate)
        finalDate.setHours(hours)
        finalDate.setMinutes(minutes)
        onChange?.(finalDate)
        onClose?.()
    }

    return (
        <div className={styles.calendarWrapper}>
            <div className={styles.header}>
                <h3 className={styles.title}>Выберите дату и время</h3>
                {onClose && (
                    <button className={styles.closeButton} onClick={onClose}>
                        <CloseIcon size={18} />
                    </button>
                )}
            </div>

            <div className={styles.calendarContainer}>
                <DayPicker
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateSelect}
                    locale={ru}
                    disabled={[
                        ...(minDate ? [{ before: minDate }] : []),
                        ...(maxDate ? [{ after: maxDate }] : []),
                    ]}
                    className={styles.calendar}
                />
            </div>

            {showTime && (
                <div className={styles.timeSection}>
                    <div className={styles.timeHeader}>
                        <ClockIcon size={18} />
                        <span>Время</span>
                    </div>
                    <div className={styles.timePicker}>
                        <div className={styles.timeInput}>
                            <input
                                type="number"
                                min="0"
                                max="23"
                                value={hours.toString().padStart(2, '0')}
                                onChange={handleHoursChange}
                                className={styles.input}
                            />
                            <span className={styles.label}>часы</span>
                        </div>
                        <span className={styles.separator}>:</span>
                        <div className={styles.timeInput}>
                            <input
                                type="number"
                                min="0"
                                max="59"
                                step="5"
                                value={minutes.toString().padStart(2, '0')}
                                onChange={handleMinutesChange}
                                className={styles.input}
                            />
                            <span className={styles.label}>минуты</span>
                        </div>
                    </div>
                    <div className={styles.selectedTime}>
                        {format(selectedDate, 'dd MMMM yyyy', { locale: ru })} в{' '}
                        {hours.toString().padStart(2, '0')}:{minutes.toString().padStart(2, '0')}
                    </div>
                </div>
            )}

            <div className={styles.footer}>
                {onClose && (
                    <button className={styles.cancelButton} onClick={onClose}>
                        Отмена
                    </button>
                )}
                <button className={styles.confirmButton} onClick={handleConfirm}>
                    Подтвердить
                </button>
            </div>
        </div>
    )
}
