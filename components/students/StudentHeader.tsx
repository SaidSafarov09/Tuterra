import React from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { EditIcon, PlusIcon, DeleteIcon } from '@/components/icons/Icons'
import { Student } from '@/types'
import styles from '../../app/(dashboard)/students/[id]/page.module.scss'

interface StudentHeaderProps {
    student: Student
    onEdit: () => void
    onCreateLesson: () => void
    onDelete: () => void
}

export function StudentHeader({ student, onEdit, onCreateLesson, onDelete }: StudentHeaderProps) {
    const router = useRouter()

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)
    }

    const stringToColor = (str: string): string => {
        let hash = 0
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash)
        }
        const hue = Math.abs(hash % 360)
        return `hsl(${hue}, 65%, 55%)`
    }

    // Calculate stats
    const totalLessons = student._count?.lessons || 0
    const totalSubjects = student.subjects.length

    return (
        <div>
            <div className={styles.header}>
                <button className={styles.backButton} onClick={() => router.back()}>
                    ← Назад к списку
                </button>
            </div>

            <div className={styles.studentHeader}>
                <div className={styles.headerTop}>
                    <div className={styles.studentProfile}>
                        <div
                            className={styles.studentAvatar}
                            style={{ backgroundColor: stringToColor(student.name) }}
                        >
                            {getInitials(student.name)}
                        </div>
                        <div className={styles.studentInfo}>
                            <h1 className={styles.studentName}>{student.name}</h1>
                            {student.contact && (
                                <div className={styles.studentContact}>
                                    {student.contact}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className={styles.headerActions}>
                        <Button variant="secondary" onClick={onEdit}>
                            <EditIcon size={18} />
                            Редактировать
                        </Button>
                        <Button onClick={onCreateLesson}>
                            <PlusIcon size={18} />
                            Занятие
                        </Button>
                        <Button variant="danger" onClick={onDelete}>
                            <DeleteIcon size={18} />
                        </Button>
                    </div>
                </div>

                <div className={styles.headerStats}>
                    <div className={styles.statItem}>
                        <span className={styles.statLabel}>Всего занятий</span>
                        <span className={styles.statValue}>{totalLessons}</span>
                    </div>
                    <div className={styles.statItem}>
                        <span className={styles.statLabel}>Предметов</span>
                        <span className={styles.statValue}>{totalSubjects}</span>
                    </div>
                </div>

                {student.note && (
                    <div className={styles.studentNote}>
                        <strong>Заметка</strong>
                        {student.note}
                    </div>
                )}
            </div>
        </div>
    )
}
