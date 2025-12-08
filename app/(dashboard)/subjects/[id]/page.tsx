'use client'

import React from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { ArrowLeft, ClockIcon } from 'lucide-react'
import { useFetch } from '@/hooks/useFetch'
import { Subject, Student } from '@/types'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { getInitials, stringToColor } from '@/lib/utils'
import styles from './page.module.scss'

export default function SubjectDetailsPage() {
    const router = useRouter()
    const params = useParams()
    const subjectId = params.id as string

    const { data: subject, isLoading: isSubjectLoading } = useFetch<Subject>(`/api/subjects/${subjectId}`)
    const { data: studentsData, isLoading: isStudentsLoading } = useFetch<Student[]>(`/api/subjects/${subjectId}/students`)
    const students = studentsData || []

    const handleAddStudent = () => {
        router.push(`/students/new?subjectId=${subjectId}`)
    }

    const handleCreateLesson = () => {
        router.push(`/lessons/new?subjectId=${subjectId}`)
    }

    if (isSubjectLoading || isStudentsLoading) {
        return <div className={styles.loading}>Загрузка...</div>
    }

    if (!subject) {
        return <div className={styles.error}>Предмет не найден</div>
    }

    return (
        <div className={`${styles.container} page-enter-animation`}>
            <div className={styles.header}>
                <Button variant="ghost" onClick={() => router.back()} className={styles.backButton}>
                    <ArrowLeft size={20} />
                    Назад
                </Button>
                <h1 className={styles.title}>{subject.name} <span style={{ backgroundColor: subject.color, width: '12px', height: '12px', borderRadius: '50%', display: 'inline-block', marginLeft: '6px' }}></span></h1>
            </div>

            <div className={styles.detailsContent}>
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
                                                {format(new Date(student.lessons[0].date), 'd MMM, HH:mm', { locale: ru })}
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

            <div className={styles.detailsFooter}>
                <Button variant="secondary" onClick={handleAddStudent} fullWidth>
                    Добавить ученика
                </Button>
                <Button onClick={handleCreateLesson} fullWidth>
                    Создать занятие
                </Button>
            </div>
        </div>
    )
}
