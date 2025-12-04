import React, { useState } from 'react'
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
    const [isDateModalOpen, setIsDateModalOpen] = useState(false)
    const [tempDate, setTempDate] = useState<Date | undefined>(formData.date)
    const [tempRecurrence, setTempRecurrence] = useState<RecurrenceRule | undefined>(formData.recurrence)

    const defaultRecurrence: RecurrenceRule = {
        enabled: false,
        type: 'weekly',
        interval: 1,
        daysOfWeek: [],
        endType: 'never',
    }

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

    return (
        <>
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

                    <div className={styles.dateTimeButton}>
                        <label className={styles.label}>Дата и время</label>
                        <Button
                            variant="secondary"
                            onClick={handleOpenDateModal}
                            disabled={isSubmitting}
                            type="button"
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
                                handleChange('isPaid', true)
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

                    <Input
                        label="Тема урока"
                        name="topic"
                        value={formData.topic || ''}
                        onChange={(e) => handleChange('topic', e.target.value)}
                        placeholder={`Например: ${topicPlaceholder}`}
                        disabled={isSubmitting}
                    />

                    <div className={styles.paymentSection}>
                        <Checkbox
                            checked={formData.isPaid}
                            onChange={(e) => handleChange('isPaid', e.target.checked)}
                            label={
                                formData.recurrence?.enabled
                                    ? 'Оплачено только первое занятие'
                                    : 'Оплачено'
                            }
                            disabled={isSubmitting || formData.price === '0'}
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
                                disabled={isSubmitting || formData.price === '0'}
                            />
                        )}
                    </div>

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
            />
        </>
    )
}
