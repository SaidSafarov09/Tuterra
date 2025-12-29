import React from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { EditIcon, PlusIcon, DeleteIcon, UsersIcon } from '@/components/icons/Icons'
import { Group } from '@/types'
import styles from '../../app/(dashboard)/groups/page.module.scss'

interface GroupHeaderProps {
    group: Group
    onEdit?: () => void
    onCreateLesson?: () => void
    onDelete?: () => void
}

export function GroupHeader({ group, onEdit, onCreateLesson, onDelete }: GroupHeaderProps) {
    const router = useRouter()

    const stringToColor = (str: string): string => {
        let hash = 0
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash)
        }
        const hue = Math.abs(hash % 360)
        return `hsl(${hue}, 65%, 55%)`
    }

    const totalLessons = group._count?.lessons || 0
    const totalStudents = group.students.length

    return (
        <div>
            <div className={styles.header}>
                <button className={styles.backButton} onClick={() => router.back()}>
                    ← Назад
                </button>
            </div>

            <div className={styles.groupHeader}>
                <div className={styles.headerTop}>
                    <div className={styles.groupProfile}>
                        <div
                            className={styles.groupAvatar}
                            style={{ backgroundColor: stringToColor(group.name) }}
                        >
                            <UsersIcon size={24} color="white" />
                        </div>
                        <div className={styles.groupInfo}>
                            <h1 className={styles.groupName}>{group.name}</h1>
                            {group.subject && (
                                <span
                                    className={styles.subjectBadge}
                                    style={{
                                        backgroundColor: `${group.subject.color}15`,
                                        color: group.subject.color,
                                        borderColor: `${group.subject.color}30`
                                    }}
                                >
                                    {group.subject.name}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className={styles.headerActions}>
                        {onEdit && (
                            <Button variant="secondary" size="small" onClick={onEdit}>
                                <EditIcon size={16} />
                                Редактировать
                            </Button>
                        )}
                        {onCreateLesson && (
                            <Button size="small" onClick={onCreateLesson}>
                                <PlusIcon size={16} />
                                Занятие
                            </Button>
                        )}
                        {onDelete && (
                            <Button variant="danger" size="small" onClick={onDelete}>
                                <DeleteIcon size={16} />
                            </Button>
                        )}
                    </div>
                </div>

                <div className={styles.studentsBlock}>
                    <div className={styles.blockTitle}>Ученики группы ({totalStudents})</div>
                    <div className={styles.chipList}>
                        {group.students.map(student => (
                            <div key={student.id} className={styles.studentChip}
                                onClick={() => router.push(`/students/${student.slug || student.id}`)}
                            >
                                <p>{student.name}</p>
                                <div style={{ backgroundColor: stringToColor(student.name) }} />
                            </div>
                        ))}
                        {group.students.length === 0 && (
                            <span className={styles.emptyText}>Нет учеников</span>
                        )}
                    </div>
                </div>

                <div className={styles.headerMeta}>
                    <div className={styles.metaItem}>
                        Занятий: <strong>{totalLessons}</strong>
                    </div>
                </div>
            </div>
        </div>
    )
}
