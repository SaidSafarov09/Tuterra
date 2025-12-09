'use client'

import React from 'react'
import { Modal, ModalFooter } from '@/components/ui/Modal'
import { RecurrenceSection } from '@/components/lessons/RecurrenceSection'
import { DatePicker } from '@/components/ui/DatePicker'
import { TimeSelect } from '@/components/ui/TimeSelect'
import type { RecurrenceRule } from '@/types/recurring'
import styles from './DateTimeRecurrenceModal.module.scss'
import { Info } from 'lucide-react'

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
    const handleConfirm = () => {
        if (date) {
            onConfirm(date, recurrence)
            onClose()
        }
    }
    const willAutoAddWeekday = () => {
        if (!date || !recurrence?.enabled) return false
        if (recurrence.type === 'daily') return false
        if (recurrence.daysOfWeek.length === 0) return false

        const selectedDayOfWeek = date.getDay()
        return !recurrence.daysOfWeek.includes(selectedDayOfWeek)
    }

    const getWeekdayName = (day: number, form: 'nominative' | 'accusative' = 'nominative') => {
        const nominative = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота']
        const accusative = ['воскресенье', 'понедельник', 'вторник', 'среду', 'четверг', 'пятницу', 'субботу']
        return form === 'accusative' ? accusative[day] : nominative[day]
    }

    return (
        <Modal
            maxWidth="650px"
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
                            value={date}
                            onChange={(newDate) => {
                                const updated = new Date(date || new Date())
                                updated.setFullYear(newDate.getFullYear())
                                updated.setMonth(newDate.getMonth())
                                updated.setDate(newDate.getDate())
                                onDateChange(updated)
                            }}
                        />
                    </div>
                    <div className={styles.timeSection}>
                        <TimeSelect
                            label="Время начала"
                            value={date}
                            onChange={(newTime) => {
                                const updated = new Date(date || new Date())
                                updated.setHours(newTime.getHours())
                                updated.setMinutes(newTime.getMinutes())
                                onDateChange(updated)
                            }}
                        />
                    </div>
                </div>

                {willAutoAddWeekday() && date && showRecurrence && (
                    <div className={styles.info}>
                        <Info size={16} />
                        <span>
                            Первое занятие будет {getWeekdayName(date.getDay(), 'accusative')} ({date.toLocaleDateString()}),
                            а последующие повторения будут только по выбранным дням.
                        </span>
                    </div>
                )}

                {!isEdit && showRecurrence && (
                    <div className={styles.recurrenceWrapper}>
                        <RecurrenceSection
                            value={recurrence || defaultRecurrence}
                            onChange={onRecurrenceChange}
                        />
                    </div>
                )}
            </div>
        </Modal>
    )
}
