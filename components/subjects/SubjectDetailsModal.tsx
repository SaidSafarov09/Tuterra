import React from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { ClockIcon } from '@/components/icons/Icons'
import { Subject, Student } from '@/types'
import { getInitials, stringToColor } from '@/lib/utils'
import styles from '../../app/(dashboard)/subjects/page.module.scss'

interface SubjectDetailsModalProps {
    isOpen: boolean
    onClose: () => void
    subject: Subject | null
    students: Student[]
    isLoading: boolean
    onAddStudent: () => void
    onCreateLesson: () => void
}

export function SubjectDetailsModal({
    isOpen,
    onClose,
    subject,
    students,
    isLoading,
    onAddStudent,
    onCreateLesson
}: SubjectDetailsModalProps) {
    const router = useRouter()

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={subject?.name || 'Предмет'}
            footer={
                <div className={styles.detailsFooter}>
                    <Button variant="secondary" onClick={onAddStudent}>
                        Добавить ученика
                    </Button>
                    <Button onClick={onCreateLesson}>
                        Создать занятие
                    </Button>
                </div>
            }
        >
            <div className={styles.detailsContent}>
                {isLoading ? (
                    <div className={styles.loading}>Загрузка учеников...</div>
                ) : students.length === 0 ? (
                    <div className={styles.emptyDetails}>
                        <p>В этом предмете пока нет учеников</p>
                    </div>
                ) : (
                    <div className={styles.studentsList}>
                        {students.map((student) => (
                            <div
                                key={student.id}
                                className={styles.studentItem}
                                onClick={() => router.push(`/students/${student.slug || student.id}`)}
                            >
                                <div className={styles.studentInfo}>
                                    <div
                                        className={styles.studentAvatar}
                                        style={{ backgroundColor: stringToColor(student.name) }}
                                    >
                                        {getInitials(student.name)}
                                    </div>
                                    <span className={styles.studentName}>{student.name}</span>
                                </div>
                                <div className={styles.lessonInfo}>
                                    {student.lessons && student.lessons.length > 0 ? (
                                        <div className={styles.nextLesson}>
                                            <ClockIcon size={14} className={styles.clockIcon} />
                                            <span>
                                                {format(new Date(student.lessons[0].date), 'd MMM, HH:mm', { locale: ru })}
                                            </span>
                                        </div>
                                    ) : (
                                        <span className={styles.noLesson}>Нет занятий</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Modal>
    )
}
