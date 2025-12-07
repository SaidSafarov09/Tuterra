import React from 'react'
import { useRouter } from 'next/navigation'
import { PhoneIcon, NoteIcon, TelegramIcon, WhatsAppIcon } from '@/components/icons/Icons'
import { Student } from '@/types'
import styles from '../../app/(dashboard)/students/page.module.scss'
import { ContactType, getContactLink } from '@/lib/contactUtils'

interface StudentsListProps {
    students: Student[]
}

export function StudentsList({ students }: StudentsListProps) {
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

    const getContactIcon = (type: string) => {
        switch (type) {
            case 'phone': return <PhoneIcon size={14} />
            case 'telegram': return <TelegramIcon size={14} />
            case 'whatsapp': return <WhatsAppIcon size={14} />
            default: return <PhoneIcon size={14} />
        }
    }

    return (
        <div className={styles.studentsGrid}>
            {students.map((student) => (
                <div
                    key={student.id}
                    className={styles.studentCard}
                    onClick={() => router.push(`/students/${student.slug || student.id}`)}
                >
                    <div className={styles.cardHeader}>
                        <div
                            className={styles.studentAvatarFallback}
                            style={{ backgroundColor: stringToColor(student.name) }}
                        >
                            {getInitials(student.name)}
                        </div>
                        <div className={styles.headerInfo}>
                            <h3 className={styles.studentName}>{student.name}</h3>
                            <div className={styles.subjectsList}>
                                {student.subjects.length > 0 ? (
                                    student.subjects.map((subject) => (
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
                                    ))
                                ) : (
                                    <span className={styles.noSubjectHint}>
                                        Нет предметов
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className={styles.cardBody}>
                        {student.contact && (
                            <div className={styles.infoRow} onClick={(e) => e.stopPropagation()}>
                                <a
                                    href={getContactLink(student.contactType as ContactType || 'phone', student.contact)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'inherit', textDecoration: 'none', width: '100%' }}
                                >
                                    <div className={styles.iconWrapper}>
                                        {getContactIcon(student.contactType || 'phone')}
                                    </div>
                                    <span className={styles.infoText}>{student.contact}</span>
                                </a>
                            </div>
                        )}

                        {student.note && (
                            <div className={styles.infoRow}>
                                <div className={styles.iconWrapper}>
                                    <NoteIcon size={14} />
                                </div>
                                <p className={styles.noteText}>{student.note}</p>
                            </div>
                        )}
                    </div>

                    <div className={styles.cardFooter}>
                        <div className={styles.statItem}>
                            <span className={styles.statLabel}>Занятий</span>
                            <span className={styles.statValue}>{student._count?.lessons || 0}</span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}
