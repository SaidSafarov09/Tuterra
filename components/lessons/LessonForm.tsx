'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Dropdown } from '@/components/ui/Dropdown'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Student, Subject, LessonFormData } from '@/types'
import styles from '@/app/(dashboard)/lessons/page.module.scss'
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

export interface LessonFormProps {
    isEdit: boolean
    formData: LessonFormData
    setFormData: React.Dispatch<React.SetStateAction<LessonFormData>>
    students: Student[]
    groups?: Group[]
    subjects: Subject[]
    isSubmitting: boolean
    error: string
    onSubmit: () => void
    onStudentChange: (studentId: string, students: Student[]) => void
    onGroupChange?: (groupId: string, groups: Group[]) => void
    onCreateStudent: (name: string) => void
    onCreateSubject: (name: string) => void
    handleChange: (name: string, value: any) => void
    fixedSubjectId?: string
    fixedStudentId?: string
    children?: React.ReactNode
}

import { Group } from '@/types'

export function LessonForm({
    isEdit,
    formData,
    setFormData,
    students,
    groups = [],
    subjects,
    isSubmitting,
    error,
    onSubmit,
    onStudentChange,
    onGroupChange,
    onCreateStudent,
    onCreateSubject,
    handleChange,
    fixedSubjectId,
    fixedStudentId,
    children
}: LessonFormProps) {
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

    useEffect(() => {
        if (fixedStudentId && formData.studentId !== fixedStudentId) {
            // Use functional update to avoid dependency on setFormData if possible, but here we use handleChange or setFormData
            // Safest is to just update it.
            setFormData(prev => ({ ...prev, studentId: fixedStudentId }))
        }
    }, [fixedStudentId])

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

    const getStudentOptions = () => {
        const options = []

        if (groups.length > 0) {
            options.push({ label: 'Группы', options: groups.map(g => ({ value: `group_${g.id}`, label: g.name })) })
        }

        if (students.length > 0) {
            options.push({ label: 'Ученики', options: students.map(s => ({ value: s.id, label: s.name })) })
        }

        return options
    }

    const handleStudentOrGroupChange = (value: string) => {
        if (value.startsWith('group_')) {
            const groupId = value.replace('group_', '')
            if (onGroupChange) {
                onGroupChange(groupId, groups)
            } else {
                // Fallback if onGroupChange is not provided (though it should be)
                const group = groups.find(g => g.id === groupId)
                if (group) {
                    setFormData(prev => ({
                        ...prev,
                        groupId: group.id,
                        studentId: undefined,
                        subjectId: group.subjectId,
                        paidStudentIds: []
                    }))
                }
            }
        } else {
            // Switching to student - reset group fields
            setFormData(prev => ({
                ...prev,
                studentId: value,
                groupId: undefined,
                paidStudentIds: [],
                subjectId: '' // Reset subject so user can select
            }))
            onStudentChange(value, students)
        }
    }

    const selectedValue = formData.groupId ? `group_${formData.groupId}` : formData.studentId

    const selectedGroup = formData.groupId ? groups.find(g => g.id === formData.groupId) : null

    const handlePaidStudentToggle = (studentId: string) => {
        setFormData(prev => {
            const currentPaid = prev.paidStudentIds || []
            const isPaid = currentPaid.includes(studentId)
            return {
                ...prev,
                paidStudentIds: isPaid
                    ? currentPaid.filter(id => id !== studentId)
                    : [...currentPaid, studentId]
            }
        })
    }

    return (
        <>
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
                        label={fixedStudentId ? "Ученик" : "Ученик / Группа"}
                        placeholder="Выберите ученика или группу"
                        value={selectedValue}
                        onChange={handleStudentOrGroupChange}
                        options={getStudentOptions()}
                        searchable
                        creatable={!fixedStudentId && !formData.groupId}
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
                        disabled={isSubmitting || !!fixedSubjectId || (!!formData.groupId && !!selectedGroup)}
                    />
                </div>

                {activeTab === 'single' ? (
                    <div className={styles.rowDate}>
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
                        label={formData.groupId ? "Стоимость с ученика (₽)" : "Стоимость (₽)"}
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
                        {!formData.groupId ? (
                            <>
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
                            </>
                        ) : (
                            <div className={styles.groupPaymentBlock}>
                                <label className={styles.label}>Оплаты участников</label>
                                <div className={styles.groupStudentsList}>
                                    {selectedGroup?.students.map(student => (
                                        <Checkbox
                                            key={student.id}
                                            checked={formData.paidStudentIds?.includes(student.id) || false}
                                            onChange={() => handlePaidStudentToggle(student.id)}
                                            label={`${student.name} (Оплатил)`}
                                            disabled={isSubmitting}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {error && <div className={styles.error}>{error}</div>}

                {children}
            </form>

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
