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
                        <Button variant="secondary" size="small" onClick={onEdit}>
                            <EditIcon size={16} />
                            Редактировать
                        </Button>
                        <Button size="small" onClick={onCreateLesson}>
                            <PlusIcon size={16} />
                            Занятие
                        </Button>
                        <Button variant="danger" size="small" onClick={onDelete}>
                            <DeleteIcon size={16} />
                        </Button>
                    </div>
                </div>

                <div className={styles.headerMeta}>
                    <div className={styles.metaItem}>
                        Занятий: <strong>{totalLessons}</strong>
                    </div>
                    <div className={styles.metaDivider} />
                    <div className={styles.metaItem}>
                        Предметов: <strong>{totalSubjects}</strong>
                    </div>
                </div>

                {student.note && (
                    <div className={styles.studentNote}>
                        <strong>Заметка</strong>
                        <p>{student.note}</p>
                    </div>
                )}
            </div>
        </div>
    )
}
