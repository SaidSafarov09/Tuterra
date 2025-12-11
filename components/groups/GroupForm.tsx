import React from 'react'
import { Input, Textarea } from '@/components/ui/Input'
import { Dropdown } from '@/components/ui/Dropdown'
import { Subject, Student } from '@/types'
import styles from '@/app/(dashboard)/groups/page.module.scss'

export interface GroupFormProps {
    isSubmitting: boolean
    error: string
    formData: {
        name: string
        subjectId: string
        subjectName: string
        studentIds: string[]
        note?: string
    }
    setFormData: (data: any) => void
    handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
    handleStudentSelection: (studentId: string) => void
    subjects: Subject[]
    students: Student[]
    onCreateSubject: (name: string) => void
    onSubmit?: (e?: React.FormEvent) => void
}

export function GroupForm({
    isSubmitting,
    error,
    formData,
    setFormData,
    handleChange,
    handleStudentSelection,
    subjects,
    students,
    onCreateSubject,
    onSubmit,
}: GroupFormProps) {
    return (
        <form className={styles.form} onSubmit={(e) => {
            e.preventDefault()
            onSubmit?.(e)
        }}>
            {error && <div style={{ color: 'var(--error)' }}>{error}</div>}

            <Input
                label="Название группы"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Например: Группа А1"
                disabled={isSubmitting}
            />

            <Dropdown
                label="Предмет"
                placeholder="Выберите или создайте предмет"
                value={formData.subjectId}
                onChange={(value) => {
                    const subject = subjects.find(s => s.id === value)
                    setFormData((prev: any) => ({
                        ...prev,
                        subjectId: value,
                        subjectName: subject ? subject.name : ''
                    }))
                }}
                options={subjects.map(s => ({ value: s.id, label: s.name }))}
                searchable
                creatable
                onCreate={onCreateSubject}
                menuPosition="relative"
                disabled={isSubmitting}
            />

            <Textarea
                label="Заметка"
                name="note"
                value={formData.note || ''}
                onChange={handleChange}
                placeholder="Добавьте заметку о группе..."
                disabled={isSubmitting}
            />

            <div className={styles.studentsSelection}>
                <label className={styles.label}>Ученики</label>
                <div className={styles.studentsList}>
                    {students.map(student => (
                        <div key={student.id} className={styles.studentItem}>
                            <input
                                type="checkbox"
                                id={`student-${student.id}`}
                                checked={formData.studentIds.includes(student.id)}
                                onChange={() => handleStudentSelection(student.id)}
                                disabled={isSubmitting}
                            />
                            <label htmlFor={`student-${student.id}`}>{student.name}</label>
                        </div>
                    ))}
                    {students.length === 0 && (
                        <div className={styles.noStudents}>Нет доступных учеников</div>
                    )}
                </div>
            </div>
        </form>
    )
}
