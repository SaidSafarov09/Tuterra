import React from 'react'
import { Button } from '@/components/ui/Button'
import { PlusIcon } from '@/components/icons/Icons'
import { Student } from '@/types'
import styles from '../../app/(dashboard)/students/[id]/page.module.scss'

interface StudentSubjectsProps {
    student: Student
    onAddSubject: () => void
    onDeleteSubject: (subjectId: string) => void
}

export function StudentSubjects({ student, onAddSubject, onDeleteSubject }: StudentSubjectsProps) {
    return (
        <div className={styles.section}>
            <div className={styles.sectionHeader}>
                <h3 className={styles.sectionTitle}>Предметы</h3>
                <Button variant="ghost" size="small" onClick={onAddSubject}>
                    <PlusIcon size={16} />
                </Button>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {student.subjects.length > 0 ? (
                    student.subjects.map((subject) => (
                        <span
                            key={subject.id}
                            style={{
                                padding: '2px 8px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: 500,
                                color: subject.color,
                                backgroundColor: subject.color + '15',
                                borderColor: subject.color + '30',
                                borderWidth: '1px',
                                borderStyle: 'solid',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                            }}
                        >
                            {subject.name}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onDeleteSubject(subject.id)
                                }}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: '0',
                                    display: 'flex',
                                    alignItems: 'center',
                                    color: subject.color,
                                    opacity: 0.7,
                                    fontSize: '16px',
                                    lineHeight: 1,
                                }}
                                title="Удалить предмет"
                            >
                                ×
                            </button>
                        </span>
                    ))
                ) : (
                    <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Нет предметов</span>
                )}
            </div>
        </div>
    )
}
