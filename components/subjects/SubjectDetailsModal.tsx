import React, { useState } from 'react'
import { TabNav } from '@/components/ui/TabNav'
import { useRouter } from 'next/navigation'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { ClockIcon } from '@/components/icons/Icons'
import { Subject, Student, Group, Lesson } from '@/types'
import { getInitials, stringToColor } from '@/lib/utils'
import styles from '../../app/(dashboard)/subjects/page.module.scss'
import { formatSmartDate } from '@/lib/dateUtils'

// Helper to get the relevant lesson based on tab
const getRelevantLesson = (lessons: Lesson[] | undefined, tab: 'upcoming' | 'past') => {
    if (!lessons || lessons.length === 0) return null;

    const now = new Date();

    if (tab === 'upcoming') {
        const future = lessons.filter(l => new Date(l.date) >= now);
        return future.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
    } else {
        const past = lessons.filter(l => new Date(l.date) < now);
        return past.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
    }
}

interface SubjectDetailsModalProps {
    isOpen: boolean
    onClose: () => void
    subject: Subject | null
    students: Student[]
    groups: Group[]
    isLoading: boolean
    onAddStudent?: () => void
    onCreateLesson?: () => void
    isStudentView?: boolean
}

export function SubjectDetailsModal({
    isOpen,
    onClose,
    subject,
    students,
    groups,
    isLoading,
    onAddStudent,
    onCreateLesson,
    isStudentView = false
}: SubjectDetailsModalProps) {
    const router = useRouter()
    const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming')

    const tabs = [
        { id: 'upcoming', label: 'Предстоящие' },
        { id: 'past', label: 'Прошедшие' }
    ]

    // Filter logic
    const displayedGroups = isStudentView
        ? groups.filter(g => !!getRelevantLesson(g.lessons, activeTab))
        : groups

    const displayedStudents = isStudentView
        ? students.filter(s => !!getRelevantLesson(s.lessons, activeTab))
        : students

    // Helper to render lesson time
    const renderLessonTime = (lessons: Lesson[] | undefined) => {
        const lesson = isStudentView ? getRelevantLesson(lessons, activeTab) : getRelevantLesson(lessons, 'upcoming')
        if (!lesson) return <span className={styles.noLesson}>{isStudentView ? 'Нет занятий' : 'Нет занятий'}</span>

        return (
            <div className={styles.nextLesson}>
                <ClockIcon size={14} className={styles.clockIcon} />
                <span>{formatSmartDate(new Date(lesson.date))}</span>
            </div>
        )
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={subject?.name || 'Предмет'}
            footer={
                !isStudentView ? (
                    <div className={styles.detailsFooter}>
                        <Button variant="secondary" onClick={onAddStudent}>
                            Добавить ученика
                        </Button>
                        <Button onClick={onCreateLesson}>
                            Создать занятие
                        </Button>
                    </div>
                ) : undefined
            }
        >
            <div className={styles.detailsContent}>
                {isStudentView && (
                    <div style={{ marginBottom: '20px' }}>
                        <TabNav
                            tabs={tabs}
                            activeTab={activeTab}
                            onTabChange={(id) => setActiveTab(id as any)}
                        />
                    </div>
                )}

                {isLoading ? (
                    <div className={styles.loading}>Загрузка данных...</div>
                ) : (
                    <>
                        {displayedGroups.length > 0 && (
                            <div className={styles.section} style={{ marginBottom: '20px' }}>
                                <div className={styles.studentsList}>
                                    {displayedGroups.map((group) => (
                                        <div
                                            key={group.id}
                                            className={styles.studentItem}
                                            onClick={() => isStudentView ? router.push(`/student/groups/${group.id}`) : router.push(`/groups/${group.id}`)}
                                        >
                                            <div className={styles.studentInfo}>
                                                <div
                                                    className={styles.studentAvatar}
                                                    style={{ backgroundColor: stringToColor(group.name) }}
                                                >
                                                    {getInitials(group.name)}
                                                </div>
                                                <div className={styles.groupInfo}>
                                                    <span className={styles.studentName}>{group.name}</span>
                                                    <span className={styles.groupStudentsCount}>
                                                        Группа из {group.students?.length || 0} человек
                                                    </span>
                                                </div>
                                            </div>
                                            <div className={styles.lessonInfo}>
                                                {renderLessonTime(group.lessons)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className={styles.section}>
                            {displayedStudents.length > 0 && (
                                <div className={styles.studentsList}>
                                    {displayedStudents.map((student) => (
                                        <div
                                            key={student.id}
                                            className={styles.studentItem}
                                            onClick={() => isStudentView ? router.push(`/student/lessons`) : router.push(`/students/${student.slug || student.id}`)}
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
                                                {renderLessonTime(student.lessons)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {isStudentView && displayedGroups.length === 0 && displayedStudents.length === 0 && (
                                <div className={styles.emptyDetails}>
                                    <p>Нет {activeTab === 'upcoming' ? 'предстоящих' : 'прошедших'} занятий</p>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </Modal>
    )
}
