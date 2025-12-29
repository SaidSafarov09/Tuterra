import React from 'react'
import { useRouter } from 'next/navigation'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { ClockIcon } from '@/components/icons/Icons'
import { Subject, Student, Group, Lesson } from '@/types'
import { getInitials, stringToColor } from '@/lib/utils'
import styles from '../../app/(dashboard)/subjects/page.module.scss'
import { formatSmartDate } from '@/lib/dateUtils'

// Вспомогательная функция для получения ближайшего будущего занятия
const getNextLesson = (lessons: Lesson[] | undefined) => {
    if (!lessons || lessons.length === 0) return null;

    const now = new Date();
    const futureLessons = lessons.filter(lesson => new Date(lesson.date) >= now);

    if (futureLessons.length === 0) return null;

    return futureLessons
        .slice()
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
};

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
                                                        {group.students?.length || 0} {group.students?.length === 1 ? 'ученик' : group.students?.length > 1 && group.students?.length < 5 ? 'ученика' : 'учеников'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className={styles.lessonInfo}>
                                                {getNextLesson(group.lessons) ? (
                                                    <div className={styles.nextLesson}>
                                                        <ClockIcon size={14} className={styles.clockIcon} />
                                                        <span>
                                                            {(() => {
                                                                const nextLesson = getNextLesson(group.lessons);
                                                                return nextLesson ? formatSmartDate(new Date(nextLesson.date)) : null;
                                                            })()}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className={styles.noLesson}>Нет занятий</span>
                                                )}
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
                                                {getNextLesson(student.lessons) ? (
                                                    <div className={styles.nextLesson}>
                                                        <ClockIcon size={14} className={styles.clockIcon} />
                                                        <span>
                                                            {(() => {
                                                                const nextLesson = getNextLesson(student.lessons);
                                                                return nextLesson ? formatSmartDate(new Date(nextLesson.date)) : null;
                                                            })()}
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
