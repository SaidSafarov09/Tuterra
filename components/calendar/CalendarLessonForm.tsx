import React from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Dropdown } from '@/components/ui/Dropdown'
import { DateTimePicker } from '@/components/ui/DateTimePicker'
import { Checkbox } from '../ui/Checkbox'
import { PlusIcon } from '@/components/icons/Icons'
import { useCalendarLessonForm } from '@/hooks/useCalendarLessonForm'
import styles from './CalendarLessonForm.module.scss'

interface CalendarLessonFormProps {
    initialDate: Date
    onSuccess: () => void
    onCancel: () => void
}

export function CalendarLessonForm({ initialDate, onSuccess, onCancel }: CalendarLessonFormProps) {
    const {
        students,
        subjects,
        formData,
        setFormData,
        isSubmitting,
        error,
        handleStudentChange,
        handleCreateStudent,
        handleCreateSubject,
        handleSubmit
    } = useCalendarLessonForm({ onSuccess, initialDate })

    return (
        <div className={styles.form}>
            {error && (
                <div className={styles.error}>{error}</div>
            )}

            <div className={styles.formGroup}>
                <div style={{ marginBottom: '8px' }}>
                    <label style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>
                        Ученик <span style={{ color: 'var(--error)' }}>*</span>
                    </label>
                </div>
                <Dropdown
                    value={formData.studentId}
                    onChange={handleStudentChange}
                    options={students.map(s => ({ value: s.id, label: s.name }))}
                    placeholder="Выберите ученика"
                    searchable
                    creatable
                    onCreate={handleCreateStudent}
                    required
                />
            </div>

            <div className={styles.formGroup}>
                <div style={{ marginBottom: '8px' }}>
                    <label style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>
                        Предмет <span style={{ color: 'var(--error)' }}>*</span>
                    </label>
                </div>
                <Dropdown
                    value={formData.subjectId}
                    onChange={(value) => setFormData(prev => ({ ...prev, subjectId: value }))}
                    options={subjects.map(s => ({ value: s.id, label: s.name }))}
                    placeholder="Выберите предмет"
                    searchable
                    creatable
                    onCreate={handleCreateSubject}
                    required
                />
            </div>

            <div className={styles.formGroup}>
                <DateTimePicker
                    label="Дата и время"
                    value={formData.date}
                    onChange={(date) => setFormData(prev => ({ ...prev, date: date || new Date() }))}
                    showTime
                    required
                />
            </div>

            <div className={styles.formGroup}>
                <Input
                    label="Стоимость (₽)"
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                    placeholder="0"
                    required
                />
            </div>

            <div className={styles.formGroup}>
                <Input
                    label="Тема урока"
                    value={formData.topic}
                    onChange={(e) => setFormData(prev => ({ ...prev, topic: e.target.value }))}
                    placeholder="Например: Логарифмы"
                />
            </div>

            <div className={styles.checkboxWrapper}>
                <Checkbox
                    checked={formData.isPaid}
                    onChange={(e) => setFormData(prev => ({ ...prev, isPaid: e.target.checked }))}
                    label="Оплачено"
                    id="isPaid"
                />
            </div>

            <div className={styles.actions}>
                <Button variant="secondary" onClick={onCancel} disabled={isSubmitting}>
                    Отмена
                </Button>
                <Button onClick={handleSubmit} disabled={isSubmitting}>
                    {isSubmitting ? 'Создание...' : 'Создать занятие'}
                </Button>
            </div>
        </div>
    )
}
