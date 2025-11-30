import React from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { EditIcon, PlusIcon } from '@/components/icons/Icons'
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

    return (
        <div>
            <div className={styles.header}>
                <Button variant="ghost" onClick={() => router.back()}>
                    ← Назад
                </Button>
                <div className={styles.headerActions}>
                    <Button variant="secondary" onClick={onEdit}>
                        <EditIcon size={18} />
                        Редактировать
                    </Button>
                    <Button onClick={onCreateLesson}>
                        <PlusIcon size={18} />
                        Создать занятие
                    </Button>
                </div>
            </div>

            <div className={styles.studentHeader}>
                <div
                    className={styles.studentAvatar}
                    style={{ backgroundColor: stringToColor(student.name) }}
                >
                    {getInitials(student.name)}
                </div>
                <div className={styles.studentInfo}>
                    <h1 className={styles.studentName}>{student.name}</h1>
                    {student.contact && (
                        <p className={styles.studentContact}>{student.contact}</p>
                    )}
                </div>
                <div className={styles.actions}>
                    <Button variant="danger" onClick={onDelete}>
                        Удалить
                    </Button>
                </div>
            </div>

            {student.note && (
                <div className={styles.section}>
                    <h3 className={styles.sectionTitle}>Заметка</h3>
                    <p className={styles.note}>{student.note}</p>
                </div>
            )}
        </div>
    )
}
