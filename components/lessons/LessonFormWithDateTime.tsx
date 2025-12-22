'use client'

import { toast } from 'sonner'
import React, { useState, useEffect, useMemo } from 'react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Dropdown } from '@/components/ui/Dropdown'
import { Checkbox } from '@/components/ui/Checkbox'
import { TrialToggle } from '@/components/lessons/TrialToggle'
import { DateTimeRecurrenceModal } from '@/components/lessons/DateTimeRecurrenceModal'
import { Subject, LessonFormData } from '@/types'
import type { RecurrenceRule } from '@/types/recurring'
import { CalendarIcon, Repeat } from 'lucide-react'
import { formatSmartDate } from '@/lib/dateUtils'
import { useTypewriter } from '@/hooks/useTypewriter'
import { LESSON_TOPIC_EXAMPLES } from '@/constants'

interface LessonFormWithDateTimeProps {
    formData: LessonFormData
    setFormData: React.Dispatch<React.SetStateAction<LessonFormData>>
    subjects: Subject[]
    onCreateSubject: (name: string) => void
    isEdit?: boolean
    isSubmitting?: boolean
    showStudentField?: boolean
    students?: Array<{ id: string; name: string }>
    onStudentChange?: (studentId: string) => void
    onCreateStudent?: (name: string) => void
    learningPlanTopics?: Array<{ id: string; title: string; isCompleted: boolean }>
}

export function LessonFormWithDateTime({
    formData,
    setFormData,
    subjects,
    onCreateSubject,
    isEdit = false,
    isSubmitting = false,
    showStudentField = false,
    students = [],
    onStudentChange,
    onCreateStudent,
    learningPlanTopics = [],
}: LessonFormWithDateTimeProps) {
    const topicPlaceholder = useTypewriter(LESSON_TOPIC_EXAMPLES)
    const [isDateModalOpen, setIsDateModalOpen] = useState(false)
    const [tempDate, setTempDate] = useState<Date | undefined>(formData.date)
    const [tempRecurrence, setTempRecurrence] = useState<RecurrenceRule | undefined>(formData.recurrence)
    const [fetchedTopics, setFetchedTopics] = useState<any[]>([])

    useEffect(() => {
        let isMounted = true

        if (formData.studentId && learningPlanTopics.length === 0) {
            fetch(`/api/students/${formData.studentId}`)
                .then(res => {
                    if (res.ok) return res.json()
                    return null
                })
                .then(data => {
                    if (isMounted) {
                        if (data && data.learningPlan) {
                            setFetchedTopics(data.learningPlan)
                            if (data.learningPlan.length > 0) {
                                toast.success(`Загружен учебный план (${data.learningPlan.length} тем)`, {
                                    id: `plan-fetch-${formData.studentId}`
                                })
                            }
                        } else {
                            setFetchedTopics([])
                        }
                    }
                })
                .catch(() => {
                    if (isMounted) setFetchedTopics([])
                })
        } else if (!formData.studentId) {
            setFetchedTopics([])
        }

        return () => { isMounted = false }
    }, [formData.studentId, learningPlanTopics.length])

    const activeTopics = useMemo(() => {
        if (learningPlanTopics.length > 0) return learningPlanTopics

        // Find student in the props list first
        const selectedStudent = students.find(s => s.id === formData.studentId)
        if (selectedStudent && 'learningPlan' in selectedStudent && (selectedStudent as any).learningPlan?.length > 0) {
            return (selectedStudent as any).learningPlan
        }

        return fetchedTopics
    }, [learningPlanTopics, students, formData.studentId, fetchedTopics])

    const handleOpenDateModal = () => {
        setTempDate(formData.date)
        setTempRecurrence(formData.recurrence)
        setIsDateModalOpen(true)
    }

    const handleConfirmDateTime = (date: Date, recurrence?: RecurrenceRule) => {
        setFormData(prev => ({
            ...prev,
            date,
            recurrence,
        }))
    }

    const getDateButtonText = () => {
        if (!formData.date) return 'Выберите дату и время'
        return formatSmartDate(formData.date)
    }

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    return (
        <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {showStudentField && students.length > 0 && onStudentChange && (
                    <Dropdown
                        label="Ученик"
                        placeholder="Выберите ученика"
                        value={formData.studentId}
                        onChange={onStudentChange}
                        options={students.map(s => ({ value: s.id, label: s.name }))}
                        searchable
                        creatable
                        onCreate={onCreateStudent}
                        disabled={isSubmitting}
                    />
                )}

                <Dropdown
                    label="Предмет"
                    placeholder="Выберите или создайте предмет"
                    value={formData.subjectId || ''}
                    onChange={(value) => handleChange('subjectId', value)}
                    options={subjects.map(s => ({ value: s.id, label: s.name }))}
                    searchable
                    creatable
                    onCreate={onCreateSubject}
                    menuPosition="relative"
                    disabled={isSubmitting}
                />

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>
                        Дата и время
                    </label>
                    <Button
                        variant="secondary"
                        onClick={handleOpenDateModal}
                        disabled={isSubmitting}
                        type="button"
                        style={{ justifyContent: 'flex-start', gap: '12px', width: '100%', textAlign: 'left' }}
                    >
                        <CalendarIcon size={18} />
                        <span>{getDateButtonText()}</span>
                        {formData.recurrence?.enabled && (
                            <Repeat size={16} style={{ marginLeft: '0.5rem', opacity: 0.7 }} />
                        )}
                    </Button>
                </div>

                <TrialToggle
                    isTrial={formData.price === '0'}
                    onChange={(isTrial) => {
                        if (isTrial) {
                            handleChange('price', '0')
                        } else {
                            handleChange('price', '')
                        }
                    }}
                    disabled={isSubmitting}
                />

                <Input
                    label="Стоимость (₽)"
                    type="number"
                    value={formData.price}
                    onChange={(e) => handleChange('price', e.target.value)}
                    placeholder="0"
                    required
                    disabled={isSubmitting}
                />

                {formData.price === '0' && formData.recurrence?.enabled && (
                    <Input
                        label="Стоимость следующих занятий (₽)"
                        type="number"
                        value={formData.seriesPrice || ''}
                        onChange={(e) => handleChange('seriesPrice', e.target.value)}
                        placeholder="Оставьте пустым, если тоже бесплатно"
                        disabled={isSubmitting}
                    />
                )}

                <Dropdown
                    label="Тема урока"
                    placeholderSearch="Создать новую тему"
                    placeholder="Выберите из плана или введите свою"
                    value={formData.topic || ''}
                    onChange={(value) => {
                        handleChange('topic', value)
                        const selectedTopic = activeTopics.find((t: any) => t.title === value)
                        handleChange('planTopicId', selectedTopic ? (selectedTopic as any).id : null)
                    }}
                    options={activeTopics.map((t: any) => ({
                        value: t.title,
                        label: `${t.title}${t.isCompleted ? ' ✓' : ''}`
                    }))}
                    searchable
                    creatable
                    onCreate={(value) => {
                        handleChange('topic', value)
                        handleChange('planTopicId', null)
                    }}
                    createOptionLabel={(value) => `Использовать тему: "${value}"`}
                    hint={activeTopics.length > 0 ? "Найдена учебная программа ученика. Выберите тему из списка или введите свою." : "Выберите тему или введите новую."}
                    disabled={isSubmitting}
                    menuPosition="relative"
                />

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid var(--border-light)' }}>
                    <Checkbox
                        checked={formData.isPaid}
                        onChange={(e) => handleChange('isPaid', e.target.checked)}
                        label={
                            formData.recurrence?.enabled
                                ? 'Оплачено только первое занятие'
                                : 'Оплачено'
                        }
                        disabled={isSubmitting}
                    />

                    {formData.recurrence?.enabled && (
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
            </div>

            <DateTimeRecurrenceModal
                isOpen={isDateModalOpen}
                onClose={() => setIsDateModalOpen(false)}
                onConfirm={handleConfirmDateTime}
                date={tempDate}
                recurrence={tempRecurrence}
                onDateChange={setTempDate}
                onRecurrenceChange={setTempRecurrence}
                isEdit={isEdit}
            />
        </>
    )
}
