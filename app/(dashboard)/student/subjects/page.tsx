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
import { SubjectDetailsModal } from '@/components/subjects/SubjectDetailsModal'

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

            <SubjectDetailsModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                subject={selectedSubject}
                students={selectedSubject?.relatedStudent ? [selectedSubject.relatedStudent] : []}
                groups={selectedSubject?.relatedGroup ? [selectedSubject.relatedGroup] : []}
                isLoading={false}
                isStudentView={true}
            />
        </div>
    )
}
