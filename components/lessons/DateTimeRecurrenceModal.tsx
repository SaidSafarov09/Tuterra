'use client'

import React, { useState, useEffect } from 'react'
import { Modal, ModalFooter } from '@/components/ui/Modal'
import { RecurrenceSection } from '@/components/lessons/RecurrenceSection'
import { DatePicker } from '@/components/ui/DatePicker'
import { TimeSelect } from '@/components/ui/TimeSelect'
import type { RecurrenceRule } from '@/types/recurring'
import styles from './DateTimeRecurrenceModal.module.scss'
import { Info } from 'lucide-react'
import { useMediaQuery } from '@/hooks/useMediaQuery'

interface DateTimeRecurrenceModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: (date: Date, recurrence?: RecurrenceRule) => void
    date: Date | undefined
    recurrence: RecurrenceRule | undefined
    onDateChange: (date: Date | undefined) => void
    onRecurrenceChange: (recurrence: RecurrenceRule) => void
    isEdit?: boolean
    showRecurrence?: boolean
}

const defaultRecurrence: RecurrenceRule = {
    enabled: false,
    type: 'weekly',
    interval: 1,
    daysOfWeek: [],
    endType: 'never',
}

export const DateTimeRecurrenceModal: React.FC<DateTimeRecurrenceModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    date,
    recurrence,
    onDateChange,
    onRecurrenceChange,
    isEdit = false,
    showRecurrence = true,
}) => {
    // Local state to track changes before confirmation
    const [localDate, setLocalDate] = useState<Date | undefined>(date)
    const [localRecurrence, setLocalRecurrence] = useState<RecurrenceRule | undefined>(recurrence)

    // Sync local state when props change or modal opens
    useEffect(() => {
        if (isOpen) {
            setLocalDate(date)
            setLocalRecurrence(recurrence)
        }
    }, [isOpen, date, recurrence])

    const handleConfirm = () => {
        if (localDate) {
            onConfirm(localDate, localRecurrence)
            onClose()
        }
    }

    const handleLocalDateChange = (newDate: Date | undefined) => {
        setLocalDate(newDate)
    }

    const handleLocalRecurrenceChange = (newRecurrence: RecurrenceRule) => {
        setLocalRecurrence(newRecurrence)
    }
    const willAutoAddWeekday = () => {
        if (!localDate || !localRecurrence?.enabled) return false
        if (localRecurrence.type === 'daily') return false
        const daysArray = typeof localRecurrence.daysOfWeek === 'string'
            ? JSON.parse(localRecurrence.daysOfWeek || '[]')
            : localRecurrence.daysOfWeek;
        if (daysArray.length === 0) return false

        const selectedDayOfWeek = localDate.getDay()
        return !daysArray.includes(selectedDayOfWeek)
    }

    const getWeekdayName = (day: number, form: 'nominative' | 'accusative' = 'nominative') => {
        const nominative = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота']
        const accusative = ['воскресенье', 'понедельник', 'вторник', 'среду', 'четверг', 'пятницу', 'субботу']
        return form === 'accusative' ? accusative[day] : nominative[day]
    }
    const isMobile = useMediaQuery("(max-width: 768px)")

    return (
        <Modal
            maxWidth={isMobile ? "100%" : "650px"}
            isOpen={isOpen}
            onClose={onClose}
            title={showRecurrence ? "Расписание" : "Дата и время занятия"}
            footer={
                <ModalFooter
                    onCancel={onClose}
                    onSubmit={handleConfirm}
                    submitText="Применить"
                    cancelText="Отмена"
                />
            }
        >
            <div className={styles.content}>
                <div className={styles.dateTimeContainer}>
                    <div className={styles.dateSection}>
                        <DatePicker
                            value={localDate}
                            onChange={(newDate) => {
                                const updated = new Date(localDate || new Date())
                                updated.setFullYear(newDate.getFullYear())
                                updated.setMonth(newDate.getMonth())
                                updated.setDate(newDate.getDate())
                                handleLocalDateChange(updated)
                            }}
                        />
                    </div>
                    <div className={styles.timeSection}>
                        <TimeSelect
                            label="Время начала"
                            value={localDate}
                            onChange={(newTime) => {
                                const updated = new Date(localDate || new Date())
                                updated.setHours(newTime.getHours())
                                updated.setMinutes(newTime.getMinutes())
                                handleLocalDateChange(updated)
                            }}
                        />
                    </div>
                </div>

                {willAutoAddWeekday() && localDate && showRecurrence && (
                    <div className={styles.info}>
                        <Info size={16} />
                        <span>
                            Первое занятие будет {getWeekdayName(localDate.getDay(), 'accusative')} ({localDate.toLocaleDateString()}),
                            а последующие повторения будут только по выбранным дням.
                        </span>
                    </div>
                )}

                {!isEdit && showRecurrence && (
                    <div className={styles.recurrenceWrapper}>
                        <RecurrenceSection
                            value={localRecurrence || defaultRecurrence}
                            onChange={handleLocalRecurrenceChange}
                        />
                    </div>
                )}
            </div>
        </Modal>
    )
}
