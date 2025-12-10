import React from 'react'
import { Group } from '@/types'
import { UsersIcon, BookIcon, ClockIcon } from 'lucide-react'
import styles from './GroupCard.module.scss'

interface GroupCardProps {
    group: Group
    onClick: () => void
}

export const GroupCard: React.FC<GroupCardProps> = ({ group, onClick }) => {
    const studentCount = group._count?.students || group.students?.length || 0
    const lessonCount = group._count?.lessons || 0
    const subjectCount = group._count?.subjects || group.subjects?.length || 0

    return (
        <div className={styles.card} onClick={onClick}>
            <div className={styles.header}>
                <div className={styles.iconWrapper}>
                    <UsersIcon size={24} />
                </div>
                <div className={styles.info}>
                    <h3 className={styles.name}>{group.name}</h3>
                    {group.note && (
                        <p className={styles.note}>{group.note}</p>
                    )}
                </div>
            </div>

            {group.subjects && group.subjects.length > 0 && (
                <div className={styles.subjects}>
                    {group.subjects.map(subject => (
                        <span
                            key={subject.id}
                            className={styles.subjectBadge}
                            style={{
                                color: subject.color,
                                backgroundColor: subject.color + '15',
                                borderColor: subject.color + '30',
                            }}
                        >
                            {subject.name}
                        </span>
                    ))}
                </div>
            )}

            <div className={styles.footer}>
                <div className={styles.stat}>
                    <UsersIcon size={14} />
                    <span>{studentCount} {studentCount === 1 ? 'ученик' : studentCount < 5 ? 'ученика' : 'учеников'}</span>
                </div>
                {subjectCount > 0 && (
                    <div className={styles.stat}>
                        <BookIcon size={14} />
                        <span>{subjectCount} {subjectCount === 1 ? 'предмет' : subjectCount < 5 ? 'предмета' : 'предметов'}</span>
                    </div>
                )}
                {lessonCount > 0 && (
                    <div className={styles.stat}>
                        <ClockIcon size={14} />
                        <span>{lessonCount} {lessonCount === 1 ? 'занятие' : lessonCount < 5 ? 'занятия' : 'занятий'}</span>
                    </div>
                )}
            </div>
        </div>
    )
}
