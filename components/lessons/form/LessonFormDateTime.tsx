import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { DatePicker } from '@/components/ui/DatePicker'
import { TimeSelect } from '@/components/ui/TimeSelect'
import { DateTimeRecurrenceModal } from '@/components/lessons/DateTimeRecurrenceModal'
import { CalendarIcon, Repeat } from 'lucide-react'
import { formatSmartDate } from '@/lib/dateUtils'
import { RecurrenceRule } from '@/types/recurring'
import styles from './LessonForm.module.scss'

interface LessonFormDateTimeProps {
    date: Date
    recurrence?: RecurrenceRule
    activeTab: 'single' | 'recurring'
    onDateTimeChange: (date: Date, recurrence?: RecurrenceRule) => void
    isEdit: boolean
    disabled?: boolean
}

export function LessonFormDateTime({
    date,
    recurrence,
    activeTab,
    onDateTimeChange,
    isEdit,
    disabled
}: LessonFormDateTimeProps) {
    const [isCalendarOpen, setIsCalendarOpen] = useState(false)
    const [isDateModalOpen, setIsDateModalOpen] = useState(false)
    const calendarRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
                setIsCalendarOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleDateChange = (newDate: Date) => {
        const updatedDate = new Date(date || new Date())
        updatedDate.setFullYear(newDate.getFullYear())
        updatedDate.setMonth(newDate.getMonth())
        updatedDate.setDate(newDate.getDate())
        onDateTimeChange(updatedDate, recurrence)
        setIsCalendarOpen(false)
    }

    const handleTimeChange = (newTime: Date) => {
        onDateTimeChange(newTime, recurrence)
    }

    const handleConfirmModal = (newDate: Date, newRecurrence?: RecurrenceRule) => {
        onDateTimeChange(newDate, newRecurrence)
    }

    if (activeTab === 'single') {
        return (
            <div className={styles.rowDate}>
                <div className={styles.dateInputWrapper} ref={calendarRef}>
                    <label className={styles.label}>Дата</label>
                    <Button
                        variant="secondary"
                        onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                        disabled={disabled}
                        type="button"
                    >
                        <CalendarIcon size={18} />
                        <span>{date ? formatSmartDate(date) : 'Выберите дату'}</span>
                    </Button>
                    {isCalendarOpen && (
                        <div className={styles.calendarPopover}>
                            <DatePicker
                                value={date}
                                onChange={handleDateChange}
                            />
                        </div>
                    )}
                </div>

                <TimeSelect
                    label="Время"
                    value={date}
                    onChange={handleTimeChange}
                    disabled={disabled}
                />
            </div>
        )
    }

    return (
        <div className={styles.dateTimeButton}>
            <label className={styles.label}>Настройка расписания</label>
            <Button
                variant="secondary"
                onClick={() => setIsDateModalOpen(true)}
                disabled={disabled}
                type="button"
            >
                <CalendarIcon size={18} />
                <span>{date ? formatSmartDate(date) : 'Выберите дату и время'}</span>
                <Repeat size={16} style={{ marginLeft: '0.5rem', opacity: 0.7 }} />
            </Button>

            <DateTimeRecurrenceModal
                isOpen={isDateModalOpen}
                onClose={() => setIsDateModalOpen(false)}
                onConfirm={handleConfirmModal}
                date={date}
                recurrence={recurrence}
                onDateChange={() => { }} // Controlled via onConfirm
                onRecurrenceChange={() => { }}
                isEdit={isEdit}
                showRecurrence={true}
            />
        </div>
    )
}
