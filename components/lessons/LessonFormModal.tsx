import React from 'react'
import { Modal, ModalFooter } from '@/components/ui/Modal'
import { Dropdown } from '@/components/ui/Dropdown'
import { DateTimePicker } from '@/components/ui/DateTimePicker'
import { Input } from '@/components/ui/Input'
import { Student, Subject, LessonFormData } from '@/types'
import styles from '../../app/(dashboard)/lessons/page.module.scss'

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
                {error && <div style={{ color: 'var(--error)' }}>{error}</div>}

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

                <Input
                    label="Цена"
                    name="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => handleChange('price', e.target.value)}
                    required
                    placeholder="1000"
                    disabled={isSubmitting}
                />

                <Input
                    label="Тема урока"
                    name="topic"
                    value={formData.topic || ''}
                    onChange={(e) => handleChange('topic', e.target.value)}
                    placeholder="Например: Введение в React"
                    disabled={isSubmitting}
                />

                <Input
                    label="Заметки"
                    name="notes"
                    value={formData.notes || ''}
                    onChange={(e) => handleChange('notes', e.target.value)}
                    placeholder="Дополнительные заметки..."
                    disabled={isSubmitting}
                />

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                        type="checkbox"
                        name="isPaid"
                        checked={formData.isPaid}
                        onChange={(e) => handleChange('isPaid', e.target.checked)}
                        disabled={isSubmitting}
                    />
                    Оплачено
                </label>
            </form>
        </Modal>
    )
}
