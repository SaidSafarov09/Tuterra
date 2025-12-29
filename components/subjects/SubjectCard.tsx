import React from 'react'
import { Subject } from '@/types'
import { UsersGroupIcon, BookIcon, EditIcon, DeleteIcon } from '@/components/icons/Icons'
import styles from '../../app/(dashboard)/subjects/page.module.scss'

interface SubjectCardProps {
    subject: Subject
    onEdit?: (subject: Subject) => void
    onDelete?: (subject: Subject) => void
    onClick?: (subject: Subject) => void
    isStudentView?: boolean
    hideActions?: boolean
}

export function SubjectCard({ subject, onEdit, onDelete, onClick, isStudentView = false, hideActions = false }: SubjectCardProps) {
    return (
        <div
            className={`${styles.subjectCard} ${!onClick ? styles.noClick : ''}`}
            onClick={() => onClick && onClick(subject)}
        >
            <div
                className={styles.colorAccent}
                style={{ backgroundColor: subject.color }}
            />

            <div className={styles.cardContent}>
                <div className={styles.cardTop}>
                    <div className={styles.subjectInfo}>
                        <div
                            className={styles.subjectIconSmall}
                            style={{
                                backgroundColor: subject.color + '20',
                                color: subject.color
                            }}
                        >
                            {subject.name[0].toUpperCase()}
                        </div>
                        <h3 className={styles.subjectName}>{subject.name}</h3>
                    </div>

                    {!hideActions && onEdit && onDelete && (
                        <div className={styles.actions}>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onEdit(subject)
                                }}
                                className={styles.actionButton}
                                title="Редактировать"
                            >
                                <EditIcon size={16} />
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onDelete(subject)
                                }}
                                className={`${styles.actionButton} ${styles.deleteButton}`}
                                title="Удалить"
                            >
                                <DeleteIcon size={16} />
                            </button>
                        </div>
                    )}
                </div>

                <div className={styles.statsRow}>
                    {!isStudentView && (
                        <>
                            <div className={styles.stat}>
                                <UsersGroupIcon size={16} />
                                <span className={styles.statValue}>{subject._count?.students || 0}</span>
                                <span className={styles.statLabel}>учеников</span>
                            </div>
                            <div className={styles.statDivider}>•</div>
                        </>
                    )}
                    <div className={styles.stat}>
                        <BookIcon size={16} />
                        <span className={styles.statValue}>{subject._count?.lessons || 0}</span>
                        <span className={styles.statLabel}>занятий</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
