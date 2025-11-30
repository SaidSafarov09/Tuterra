import React from 'react'
import { Button } from '@/components/ui/Button'
import { PlusIcon, DeleteIcon } from '@/components/icons/Icons'
import { Student } from '@/types'
import styles from '../../app/(dashboard)/students/[id]/page.module.scss'

interface StudentSubjectsProps {
    student: Student
    onAddSubject: () => void
    onDeleteSubject: (subjectId: string, subjectName: string) => void
}

export function StudentSubjects({ student, onAddSubject, onDeleteSubject }: StudentSubjectsProps) {
    return (
        <div className={styles.section}>
            <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Предметы</h2>
            </div>

            <div className={styles.subjectsGrid}>
                {student.subjects.map((subject) => (
                    <div
                        key={subject.id}
                        className={styles.subjectChip}
                        style={{
                            backgroundColor: subject.color + '15',
                            color: subject.color,
                            borderColor: subject.color + '30',
                        }}
                    >
                        {subject.name}
                        <button
                            className={styles.deleteSubjectButton}
                            style={{ color: subject.color }}
                            onClick={() => onDeleteSubject(subject.id, subject.name)}
                            title="Удалить предмет у ученика"
                        >
                            <DeleteIcon size={14} />
                        </button>
                    </div>
                ))}

                <button
                    className={styles.addSubjectChip}
                    onClick={onAddSubject}
                >
                    <PlusIcon size={14} />
                    Добавить
                </button>
            </div>
        </div>
    )
}
