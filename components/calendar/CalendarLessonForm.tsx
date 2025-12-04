import React from 'react'
import { Button } from '@/components/ui/Button'
import { LessonFormWithDateTime } from '@/components/lessons/LessonFormWithDateTime'
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
            <LessonFormWithDateTime
                formData={formData}
                setFormData={setFormData}
                subjects={subjects}
                onCreateSubject={handleCreateSubject}
                isSubmitting={isSubmitting}
                showStudentField={true}
                students={students}
                onStudentChange={handleStudentChange}
            />

            {error && <div className={styles.error}>{error}</div>}

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
