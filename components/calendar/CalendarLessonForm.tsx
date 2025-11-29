import React from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Dropdown } from '@/components/ui/Dropdown'
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
                <Dropdown
                    label="Ученик"
                    value={formData.studentId}
                    onChange={handleStudentChange}
                    options={[
                        { value: '', label: 'Выберите ученика' },
                        ...students.map(s => ({ value: s.id, label: s.name }))
                    ]}
                    placeholder="Выберите ученика"
                    searchable
                    creatable
                    onCreate={handleCreateStudent}
                />
            </div>

            <div className={styles.formGroup}>
                <Dropdown
                    label="Предмет"
                    value={formData.subjectId}
                    onChange={(value) => setFormData(prev => ({ ...prev, subjectId: value }))}
                    options={[
                        { value: '', label: 'Без предмета' },
                        ...subjects.map(s => ({ value: s.id, label: s.name }))
                    ]}
                    placeholder="Выберите предмет"
                    searchable
                    creatable
                    onCreate={handleCreateSubject}
                />
            </div>

            <div className={styles.row}>
                <div className={styles.formGroup}>
                    <label>Дата</label>
                    <Input
                        type="datetime-local"
                        value={new Date(formData.date.getTime() - formData.date.getTimezoneOffset() * 60000).toISOString().slice(0, 16)}
                        onChange={(e) => setFormData(prev => ({ ...prev, date: new Date(e.target.value) }))}
                    />
                </div>

                <div className={styles.formGroup}>
                    <label>Стоимость (₽)</label>
                    <Input
                        type="number"
                        value={formData.price}
                        onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                        placeholder="0"
                    />
                </div>
            </div>

            <div className={styles.formGroup}>
                <label>Заметки</label>
                <Input
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Дополнительная информация..."
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
