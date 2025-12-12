import React from 'react'
import { useRouter } from 'next/navigation'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { ClockIcon } from '@/components/icons/Icons'
import { Subject, Student, Group } from '@/types'
import { getInitials, stringToColor } from '@/lib/utils'
import styles from '../../app/(dashboard)/subjects/page.module.scss'
import { formatSmartDate } from '@/lib/dateUtils'

interface SubjectDetailsModalProps {
    isOpen: boolean
    onClose: () => void
    subject: Subject | null
    students: Student[]
    groups: Group[]
    isLoading: boolean
    onAddStudent: () => void
    onCreateLesson: () => void
}

export function SubjectDetailsModal({
    isOpen,
    onClose,
    subject,
    students,
    groups,
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
                    <div className={styles.loading}>Загрузка данных...</div>
                ) : (
                    <>
                        {groups && groups.length > 0 && (
                            <div className={styles.section} style={{ marginBottom: '20px' }}>
                                <h3 className={styles.sectionTitle} style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600 }}>Группы</h3>
                                <div className={styles.studentsList}>
                                    {groups.map((group) => (
                                        <div
                                            key={group.id}
                                            className={styles.studentItem}
                                            onClick={() => router.push(`/groups/${group.id}`)}
                                        >
                                            <div className={styles.studentInfo}>
                                                <div
                                                    className={styles.studentAvatar}
                                                    style={{ backgroundColor: stringToColor(group.name) }}
                                                >
                                                    {getInitials(group.name)}
                                                </div>
                                                <span className={styles.studentName}>{group.name}</span>
                                            </div>
                                            <div className={styles.lessonInfo}>
                                                <span className={styles.noLesson}>{group.students?.length || 0} учеников</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className={styles.section}>
                            <h3 className={styles.sectionTitle} style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600 }}>Ученики</h3>
                            {students.length === 0 ? (
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
                                                            {formatSmartDate(new Date(student.lessons[0].date))}
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
                    </>
                )}
            </div>
        </Modal>
    )
}
