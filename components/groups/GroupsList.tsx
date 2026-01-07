import React from 'react'
import { useRouter } from 'next/navigation'
import { Group } from '@/types'
import styles from '../../app/(dashboard)/groups/page.module.scss'
import { NoteIcon } from '../icons/Icons'

import { useCheckLimit } from '@/hooks/useCheckLimit'

interface GroupsListProps {
    groups: Group[]
    isStudentView?: boolean
}

export function GroupsList({ groups, isStudentView = false }: GroupsListProps) {
    const router = useRouter()
    const { checkLimit, UpgradeModal } = useCheckLimit()

    const handleGroupClick = (group: Group) => {
        if (group.isLocked) {
            checkLimit('groups', 100) // Trigger modal
            return
        }
        const basePath = isStudentView ? '/student/groups' : '/groups'
        router.push(`${basePath}/${group.id}`)
    }

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
        <div className={styles.groupsGrid}>
            {groups.map((group) => (
                <div
                    key={group.id}
                    className={`${styles.groupCard} ${group.isLocked ? styles.lockedCard : ''}`}
                    onClick={() => handleGroupClick(group)}
                    style={{ position: 'relative' }}
                >
                    {group.isLocked && (
                        <div className={styles.lockOverlay}>
                            <div className={styles.lockBadge}>
                                <NoteIcon size={14} /> <span>PRO</span>
                            </div>
                        </div>
                    )}
                    <div className={styles.cardHeader}>
                        <div
                            className={styles.groupAvatarFallback}
                            style={{ backgroundColor: stringToColor(group.name) }}
                        >
                            {getInitials(group.name)}
                        </div>
                        <div className={styles.headerInfo}>
                            <h3 className={styles.groupName}>{group.name}</h3>
                            <div className={styles.subjectsList}>
                                <span
                                    className={styles.subjectBadge}
                                    style={{
                                        color: group.subject.color,
                                        backgroundColor: group.subject.color + '15',
                                        borderColor: group.subject.color + '30',
                                    }}
                                >
                                    {group.subject.name}
                                </span>
                            </div>
                        </div>
                    </div>
                    {group.note && (
                        <div className={styles.infoRow}>
                            <div className={styles.iconWrapper}>
                                <NoteIcon size={14} />
                            </div>
                            <p className={styles.noteText}>{group.note}</p>
                        </div>
                    )}

                    <div className={styles.cardBody}>
                        <div className={styles.statItem}>
                            <span className={styles.statLabel}>Учеников</span>
                            <span className={styles.statValue}>{group._count?.students || 0}</span>
                        </div>
                    </div>

                    <div className={styles.cardFooter}>
                        <div className={styles.statItem}>
                            <span className={styles.statLabel}>Занятий</span>
                            <span className={styles.statValue}>{group._count?.lessons || 0}</span>
                        </div>
                    </div>
                </div>
            ))}
            {UpgradeModal}
        </div>
    )
}
