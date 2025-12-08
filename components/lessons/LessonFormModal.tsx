'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Modal, ModalFooter } from '@/components/ui/Modal'
import { Dropdown } from '@/components/ui/Dropdown'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Student, Subject, LessonFormData } from '@/types'
import styles from '../../app/(dashboard)/lessons/page.module.scss'
import { useTypewriter } from '@/hooks/useTypewriter'
import { LESSON_TOPIC_EXAMPLES } from '@/constants'
import { TrialToggle } from '@/components/lessons/TrialToggle'
import { Checkbox } from '@/components/ui/Checkbox'
import { DateTimeRecurrenceModal } from '@/components/lessons/DateTimeRecurrenceModal'
import type { RecurrenceRule } from '@/types/recurring'
import { CalendarIcon, Repeat } from 'lucide-react'
import { formatSmartDate } from '@/lib/dateUtils'
import { DurationSelector } from '@/components/lessons/DurationSelector'
import { formatLessonEndTime } from '@/lib/lessonTimeUtils'
import { ClockIcon } from '@/components/icons/Icons'
import { Tabs } from '@/components/ui/Tabs'
import { DatePicker } from '@/components/ui/DatePicker'
import { TimeSelect } from '@/components/ui/TimeSelect'

interface LessonFormModalProps {
    isOpen: boolean
    onClose: () => void
    isEdit: boolean
    formData: LessonFormData
    setFormData: React.Dispatch<React.SetStateAction<LessonFormData>>
    students: Student[]
    subjects: Subject[]
    isSubmitting: boolean
    error: string
    onSubmit: () => void
    onStudentChange: (studentId: string, students: Student[]) => void
    onCreateStudent: (name: string) => void
    onCreateSubject: (name: string) => void
    handleChange: (name: string, value: any) => void
    fixedSubjectId?: string
    fixedStudentId?: string
    customTitle?: string
}

export function LessonFormModal({
    isOpen,
    onClose,
    isEdit,
    formData,
    setFormData,
    students,
    subjects,
    isSubmitting,
    error,
    onSubmit,
    onStudentChange,
    onCreateStudent,
    onCreateSubject,
    handleChange,
    fixedSubjectId,
    fixedStudentId,
    customTitle
}: LessonFormModalProps) {
    const topicPlaceholder = useTypewriter(LESSON_TOPIC_EXAMPLES)
    const [isDateModalOpen, setIsDateModalOpen] = useState(false)
    const [tempDate, setTempDate] = useState<Date | undefined>(formData.date)
    const [tempRecurrence, setTempRecurrence] = useState<RecurrenceRule | undefined>(formData.recurrence)
    const [activeTab, setActiveTab] = useState('single')

    const [isCalendarOpen, setIsCalendarOpen] = useState(false)
    const calendarRef = useRef<HTMLDivElement>(null)

    // Close calendar on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
                setIsCalendarOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const defaultRecurrence: RecurrenceRule = {
        enabled: true,
        type: 'weekly',
        interval: 1,
        daysOfWeek: [],
        endType: 'never',
    }

    const handleTabChange = (tabId: string) => {
        setActiveTab(tabId)
        if (tabId === 'single') {
            setFormData(prev => ({
                ...prev,
                recurrence: undefined
            }))
        } else {
            if (!formData.recurrence?.enabled) {
                setFormData(prev => ({
                    ...prev,
                    recurrence: defaultRecurrence
                }))
            }
        }
    }

    const handleOpenDateModal = () => {
        setTempDate(formData.date)
        setTempRecurrence(formData.recurrence || (activeTab === 'recurring' ? defaultRecurrence : undefined))
        setIsDateModalOpen(true)
    }

    const handleConfirmDateTime = (date: Date, recurrence?: RecurrenceRule) => {
        setFormData(prev => ({
            ...prev,
            date,
            recurrence,
        }))
    }

    const handleDateChange = (date: Date) => {
        const newDate = new Date(formData.date || new Date())
        newDate.setFullYear(date.getFullYear())
        newDate.setMonth(date.getMonth())
        newDate.setDate(date.getDate())

        setFormData(prev => ({ ...prev, date: newDate }))
        setIsCalendarOpen(false)
    }

    const handleTimeChange = (date: Date) => {
        setFormData(prev => ({ ...prev, date }))
    }

    const getDateButtonText = () => {
        if (!formData.date) return 'Выберите дату и время'
        return formatSmartDate(formData.date)
    }

    const title = customTitle || (isEdit ? "Редактировать занятие" : "Добавить занятие")

    return (
        <>
            <Modal
                maxWidth="650px"
                minHeight='580px'
                isOpen={isOpen}
                onClose={onClose}
                title={title}
                footer={
                    <ModalFooter
                        onCancel={onClose}
                        onSubmit={onSubmit}
                        isLoading={isSubmitting}
                        submitText={isEdit ? "Сохранить" : "Добавить"}
                    />
                }
            >
                <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
                    {!isEdit && (
                        <Tabs
                            tabs={[
                                { id: 'single', label: 'Одно занятие' },
                                { id: 'recurring', label: 'Регулярное занятие' }
                            ]}
                            activeTab={activeTab}
                            onChange={handleTabChange}
                        />
                    )}

                    <div className={styles.row}>
                        <Dropdown
                            label="Ученик"
                            placeholder="Выберите или создайте ученика"
                            value={fixedStudentId || formData.studentId}
                            onChange={(value) => {
                                if (fixedSubjectId) {
                                    handleChange('studentId', value)
                                } else {
                                    onStudentChange(value, students)
                                }
                            }}
                            options={students.map((student) => ({
                                value: student.id,
                                label: student.name,
                            }))}
                            searchable
                            creatable={!fixedStudentId}
                            onCreate={onCreateStudent}
                            menuPosition="relative"
                            required
                            disabled={isSubmitting || !!fixedStudentId}
                        />

                        <Dropdown
                            label="Предмет"
                            placeholder="Выберите или создайте предмет"
                            value={formData.subjectId}
                            onChange={(value) => setFormData((prev) => ({ ...prev, subjectId: value }))}
                            options={subjects.map((subject) => ({
                                value: subject.id,
                                label: subject.name,
                            }))}
                            searchable
                            creatable={!fixedSubjectId}
                            onCreate={onCreateSubject}
                            menuPosition="relative"
                            disabled={isSubmitting || !!fixedSubjectId}
                        />
                    </div>

                    {activeTab === 'single' ? (
                        <div className={styles.row}>
                            <div className={styles.dateInputWrapper} ref={calendarRef}>
                                <label className={styles.label}>Дата</label>
                                <Button
                                    variant="secondary"
                                    onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                                    disabled={isSubmitting}
                                    type="button"
                                >
                                    <CalendarIcon size={18} />
                                    <span>{formData.date ? formatSmartDate(formData.date) : 'Выберите дату'}</span>
                                </Button>
                                {isCalendarOpen && (
                                    <div className={styles.calendarPopover}>
                                        <DatePicker
                                            value={formData.date}
                                            onChange={handleDateChange}
                                        />
                                    </div>
                                )}
                            </div>

                            <TimeSelect
                                label="Время"
                                value={formData.date}
                                onChange={handleTimeChange}
                                disabled={isSubmitting}
                            />
                        </div>
                    ) : (
                        <div className={styles.dateTimeButton}>
                            <label className={styles.label}>Настройка расписания</label>
                            <Button
                                variant="secondary"
                                onClick={handleOpenDateModal}
                                disabled={isSubmitting}
                                type="button"
                            >
                                <CalendarIcon size={18} />
                                <span>{getDateButtonText()}</span>
                                <Repeat size={16} style={{ marginLeft: '0.5rem', opacity: 0.7 }} />
                            </Button>
                        </div>
                    )}

                    <TrialToggle
                        isTrial={formData.isTrial || false}
                        onChange={(isTrial) => {
                            handleChange('isTrial', isTrial)
                            if (isTrial) {
                                handleChange('price', '0')
                                handleChange('isPaid', false)
                            }
                        }}
                        disabled={isSubmitting}
                    />

                    <div className={styles.priceRow}>
                        <Input
                            label="Стоимость (₽)"
                            type="number"
                            value={formData.price}
                            onChange={(e) => {
                                const newPrice = e.target.value
                                handleChange('price', newPrice)

                                if (newPrice === '0') {
                                    handleChange('isPaid', false)
                                }
                            }}
                            placeholder="0"
                            required
                            disabled={isSubmitting}
                        />

                        <DurationSelector
                            value={formData.duration}
                            onChange={(value) => handleChange('duration', value)}
                            disabled={isSubmitting}
                        />

                        <div className={styles.endTimeContainer}>
                            <label className={styles.label}>Окончание</label>
                            <div className={styles.endTimeValue}>
                                <ClockIcon size={16} />
                                {formData.date ? formatLessonEndTime(formData.date, formData.duration) : '—'}
                            </div>
                        </div>
                    </div>

                    {(formData.price === '0' || formData.isTrial) && activeTab === 'recurring' && (
                        <Input
                            label="Стоимость следующих занятий (₽)"
                            type="number"
                            value={formData.seriesPrice || ''}
                            onChange={(e) => handleChange('seriesPrice', e.target.value)}
                            placeholder={
                                formData.price === '0'
                                    ? "Оставьте пустым, если тоже бесплатно"
                                    : "Оставьте пустым, если цена как у пробного"
                            }
                            disabled={isSubmitting}
                        />
                    )}

                    {!formData.recurrence?.enabled && (
                        <Input
                            label="Тема урока"
                            name="topic"
                            value={formData.topic || ''}
                            onChange={(e) => handleChange('topic', e.target.value)}
                            placeholder={`Например: ${topicPlaceholder}`}
                            disabled={isSubmitting}
                        />)}

                    {formData.price !== '0' && (
                        <div className={styles.paymentSection}>
                            <Checkbox
                                checked={formData.isPaid}
                                onChange={(e) => handleChange('isPaid', e.target.checked)}
                                label={
                                    activeTab === 'recurring'
                                        ? 'Оплачено только первое занятие'
                                        : 'Оплачено'
                                }
                                disabled={isSubmitting}
                            />

                            {activeTab === 'recurring' && (
                                <Checkbox
                                    checked={formData.isPaidAll || false}
                                    onChange={(e) => {
                                        const checked = e.target.checked
                                        handleChange('isPaidAll', checked)
                                        if (checked) {
                                            handleChange('isPaid', true)
                                        }
                                    }}
                                    label="Оплачены все занятия серии"
                                    disabled={isSubmitting}
                                />
                            )}
                        </div>
                    )}

                    {error && <div className={styles.error}>{error}</div>}
                </form>
            </Modal>

            <DateTimeRecurrenceModal
                isOpen={isDateModalOpen}
                onClose={() => setIsDateModalOpen(false)}
                onConfirm={handleConfirmDateTime}
                date={tempDate}
                recurrence={tempRecurrence}
                onDateChange={setTempDate}
                onRecurrenceChange={setTempRecurrence}
                isEdit={isEdit}
                showRecurrence={activeTab === 'recurring'}
            />
        </>
    )
}
