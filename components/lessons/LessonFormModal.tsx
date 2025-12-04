import React from 'react'
import { Modal, ModalFooter } from '@/components/ui/Modal'
import { Dropdown } from '@/components/ui/Dropdown'
import { DateTimePicker } from '@/components/ui/DateTimePicker'
import { Input } from '@/components/ui/Input'
import { Student, Subject, LessonFormData } from '@/types'
import styles from '../../app/(dashboard)/lessons/page.module.scss'
import { useTypewriter } from '@/hooks/useTypewriter'
import { LESSON_TOPIC_EXAMPLES } from '@/constants'
import { TrialToggle } from '@/components/lessons/TrialToggle'
import { Checkbox } from '@/components/ui/Checkbox'
import { RecurrenceSection } from '@/components/lessons/RecurrenceSection'
import type { RecurrenceRule } from '@/types/recurring'

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
    handleChange
}: LessonFormModalProps) {
    const topicPlaceholder = useTypewriter(LESSON_TOPIC_EXAMPLES)

    // Default recurrence rule
    const defaultRecurrence: RecurrenceRule = {
        enabled: false,
        type: 'weekly',
        interval: 1,
        daysOfWeek: [],
        endType: 'never',
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEdit ? "Редактировать занятие" : "Добавить занятие"}
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

                <Dropdown
                    label="Ученик"
                    placeholder="Выберите или создайте ученика"
                    value={formData.studentId}
                    onChange={(value) => onStudentChange(value, students)}
                    options={students.map((student) => ({
                        value: student.id,
                        label: student.name,
                    }))}
                    searchable
                    creatable
                    onCreate={onCreateStudent}
                    menuPosition="relative"
                    required
                    disabled={isSubmitting}
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
                    creatable
                    onCreate={onCreateSubject}
                    menuPosition="relative"
                    disabled={isSubmitting}
                />

                <DateTimePicker
                    label="Дата и время"
                    value={formData.date}
                    onChange={(date) => setFormData((prev) => ({ ...prev, date }))}
                    showTime
                    required
                    disabled={isSubmitting}
                    dropDirection="center"
                />

                <TrialToggle
                    isTrial={formData.price === '0'}
                    onChange={(isTrial) => {
                        if (isTrial) {
                            handleChange('price', '0')
                            handleChange('isPaid', true)
                        } else {
                            handleChange('price', '')
                        }
                    }}
                    disabled={isSubmitting}
                />

                <Input
                    label="Цена"
                    name="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => handleChange('price', e.target.value)}
                    required={formData.price !== '0'}
                    placeholder="1000"
                    disabled={isSubmitting || formData.price === '0'}
                />

                <Input
                    label="Тема урока"
                    name="topic"
                    value={formData.topic || ''}
                    onChange={(e) => handleChange('topic', e.target.value)}
                    placeholder={`Например: ${topicPlaceholder}`}
                    disabled={isSubmitting}
                />

                {!isEdit && (
                    <RecurrenceSection
                        value={formData.recurrence || defaultRecurrence}
                        onChange={(recurrence) => setFormData((prev) => ({ ...prev, recurrence }))}
                        disabled={isSubmitting}
                    />
                )}

                {formData.price !== '0' && (
                    <div className={styles.paymentSection}>
                        <Checkbox
                            checked={formData.isPaid}
                            onChange={(e) => handleChange('isPaid', e.target.checked)}
                            label={formData.recurrence?.enabled ? "Оплачено только первое занятие" : "Оплачено"}
                            disabled={isSubmitting}
                        />

                        {formData.recurrence?.enabled && (
                            <Checkbox
                                checked={formData.isPaidAll || false}
                                onChange={(e) => {
                                    handleChange('isPaidAll', e.target.checked)
                                    // If "Paid all" is checked, "Paid first" should also be visually checked or handled
                                    if (e.target.checked) {
                                        handleChange('isPaid', true)
                                    }
                                }}
                                label="Оплачены все занятия серии"
                                disabled={isSubmitting}
                            />
                        )}
                    </div>
                )}
            </form>
        </Modal>
    )
}
