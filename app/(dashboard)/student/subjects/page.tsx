'use client'

import React, { useState, useEffect } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Section } from '@/components/ui/Section'
import { SubjectCard } from '@/components/subjects/SubjectCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { SubjectsIcon } from '@/components/icons/Icons'
import { SubjectCardSkeleton } from '@/components/skeletons'
import { toast } from 'sonner'
import styles from './page.module.scss'
import { Modal } from '@/components/ui/Modal'
import { StudentLessons } from '@/components/students/StudentLessons'
import { useLessonActions } from '@/hooks/useLessonActions'

export default function StudentSubjectsPage() {
    const [subjects, setSubjects] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const fetchSubjects = async () => {
            try {
                const response = await fetch('/api/student/subjects')
                const data = await response.json()
                if (response.ok) {
                    setSubjects(data)
                } else {
                    toast.error(data.error || 'Ошибка при загрузке предметов')
                }
            } catch (err) {
                toast.error('Произошла ошибка')
            } finally {
                setIsLoading(false)
            }
        }
        fetchSubjects()
    }, [])

    const [selectedSubject, setSelectedSubject] = useState<any>(null)
    const [subjectLessons, setSubjectLessons] = useState<any[]>([])
    const [isLessonsLoading, setIsLessonsLoading] = useState(false)
    const [isModalOpen, setIsModalOpen] = useState(false)

    // Handle subject click
    const handleSubjectClick = async (subject: any) => {
        setSelectedSubject(subject)
        setIsModalOpen(true)
        setIsLessonsLoading(true)

        try {
            // Fetch lessons for this subject
            // We can reuse the main lessons API with filters, or student lessons API
            // Let's use /api/student/lessons?subjectId=... if it exists, or filtered /api/lessons
            const response = await fetch(`/api/lessons?subjectId=${subject.id}`)
            if (response.ok) {
                const data = await response.json()
                setSubjectLessons(data)
            } else {
                toast.error('Не удалось загрузить занятия')
            }
        } catch (error) {
            console.error(error)
            toast.error('Ошибка загрузки занятий')
        } finally {
            setIsLessonsLoading(false)
        }
    }

    const { togglePaidStatus, toggleCancelLesson, rescheduleLesson } = useLessonActions(undefined, true) // Pass isStudent=true

    return (
        <div className={styles.container}>
            <PageHeader
                title="Мои предметы"
                subtitle="Предметы, которые вы изучаете с преподавателями"
            />

            {isLoading ? (
                <div className={styles.subjectsGrid}>
                    <SubjectCardSkeleton />
                    <SubjectCardSkeleton />
                    <SubjectCardSkeleton />
                </div>
            ) : subjects.length === 0 ? (
                <EmptyState
                    icon={<SubjectsIcon size={64} color="#9CA3AF" />}
                    title="У вас пока нет предметов"
                    description="Когда ваш преподаватель назначит вам предмет, он появится здесь."
                />
            ) : (
                <div className={styles.subjectsGrid}>
                    {subjects.map((subject) => (
                        <div
                            key={subject.id}
                            className={styles.cardWrapper}
                            onClick={() => handleSubjectClick(subject)}
                            style={{ cursor: 'pointer' }}
                        >
                            <SubjectCard
                                subject={subject}
                                isStudentView={true}
                                hideActions={true}
                            />
                            <div className={styles.teacherBadge}>
                                Преподаватель: {subject.teacherName}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={selectedSubject ? `Занятия: ${selectedSubject.name}` : 'Занятия'}
                size="large"
            >
                {isLessonsLoading ? (
                    <div style={{ padding: '40px', textAlign: 'center' }}>Загрузка занятий...</div>
                ) : (
                    <StudentLessons
                        lessons={subjectLessons}
                        student={{ id: 'me', name: 'Я', subjects: [] } as any} // Mock student object since we are the student
                        onTogglePaidStatus={(lessonId) => {
                            const l = subjectLessons.find(x => x.id === lessonId)
                            if (l) togglePaidStatus(l)
                        }}
                        onToggleCancelLesson={(lessonId) => {
                            const l = subjectLessons.find(x => x.id === lessonId)
                            if (l) toggleCancelLesson(l)
                        }}
                        onRescheduleLesson={(lessonId) => {
                            const l = subjectLessons.find(x => x.id === lessonId)
                            if (l) rescheduleLesson(l)
                        }}
                        isStudentView={true}
                    />
                )}
            </Modal>
        </div>
    )
}
