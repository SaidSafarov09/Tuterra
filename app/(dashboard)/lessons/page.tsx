'use client'

import React, { useEffect, useState, Suspense, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { PlusIcon } from '@/components/icons/Icons'
import { TabNav } from '@/components/ui/TabNav'
import { LessonsList } from '@/components/lessons/LessonsList'
import { LessonFormModal } from '@/components/lessons/LessonFormModal'
import { DeleteLessonDialog } from '@/components/lessons/DeleteLessonDialog'
import { useLessonActions } from '@/hooks/useLessonActions'
import { useLessonForm } from '@/hooks/useLessonForm'
import { useFetch } from '@/hooks/useFetch'
import { useLessonsByTab } from '@/hooks/useLessonsByTab'
import { Lesson, Student, Subject, LessonFilter } from '@/types'
import styles from './page.module.scss'
import { LESSON_TABS } from '@/constants'
import { LessonDetailSkeleton } from '@/components/skeletons'
import { EmptyLessonsState } from '@/components/lessons/EmptyLessonsState'
import { RescheduleModal } from '@/components/lessons/RescheduleModal'


function LessonsContent() {
    const router = useRouter()
    const searchParams = useSearchParams()


    const [activeTab, setActiveTab] = useState<LessonFilter>('upcoming')
    const [isOpen, setIsOpen] = useState(false)
    const [editingLesson, setEditingLesson] = useState<Lesson | null>(null)
    const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; lesson: Lesson | null }>({
        isOpen: false,
        lesson: null,
    })


    const {
        lessons,
        allLessonsCount,
        lessonsCounts,
        isLoading: isLessonsLoading,
        isRefreshing: isLessonsRefreshing,
        refetch: refetchLessons
    } = useLessonsByTab(activeTab)

    const {
        data: students = [],
        refetch: refetchStudents
    } = useFetch<Student[]>('/api/students')

    const {
        data: subjects = [],
        refetch: refetchSubjects
    } = useFetch<Subject[]>('/api/subjects')


    const {
        togglePaid,
        toggleCancel,
        deleteLesson,
        handleRescheduleLesson,
        handleConfirmReschedule,
        isLoading,
        isRescheduleModalOpen,
        setIsRescheduleModalOpen,
        reschedulingLesson,
    } = useLessonActions(refetchLessons)

    const {
        formData,
        setFormData,
        isSubmitting,
        error,
        resetForm,
        loadLesson,
        handleChange,
        handleStudentChange,
        handleCreateStudent,
        handleCreateSubject,
        handleSubmit: submitForm
    } = useLessonForm(
        () => {
            setIsOpen(false)
            refetchLessons()
        },
        refetchStudents,
        refetchSubjects
    )


    const tabsWithCounts = useMemo(() =>
        LESSON_TABS.map(tab => ({
            ...tab,
            count: lessonsCounts[tab.id as keyof typeof lessonsCounts]
        })),
        [lessonsCounts]
    )


    useEffect(() => {
        const tab = searchParams.get('tab') as LessonFilter
        if (tab && ['upcoming', 'past', 'unpaid', 'canceled'].includes(tab)) {
            setActiveTab(tab)
        }
    }, [searchParams])


    const handleTabChange = (id: string) => {
        setActiveTab(id as LessonFilter)
        router.push(`/lessons?tab=${id}`)
    }

    const handleOpenModal = () => {
        setEditingLesson(null)
        resetForm()
        setIsOpen(true)
    }

    const handleEditLesson = (lesson: Lesson) => {
        setEditingLesson(lesson)
        loadLesson(lesson)
        setIsOpen(true)
    }

    const handleDeleteClick = (lessonId: string) => {
        const lesson = lessons.find(l => l.id === lessonId)
        if (lesson) {
            setDeleteConfirm({ isOpen: true, lesson })
        }
    }

    const handleConfirmDelete = async (scope: 'single' | 'series') => {
        if (deleteConfirm.lesson) {
            await deleteLesson(deleteConfirm.lesson.id, scope)
            setDeleteConfirm({ isOpen: false, lesson: null })
        }
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.headerText}>
                    <h1 className={styles.title}>Занятия</h1>
                    <p className={styles.subtitle}>Управление расписанием</p>
                </div>
                <Button onClick={handleOpenModal} className={styles.addButton}>
                    <PlusIcon size={20} />
                    Добавить занятие
                </Button>
            </div>

            <TabNav
                tabs={tabsWithCounts}
                activeTab={activeTab}
                onTabChange={handleTabChange}
                className={styles.tabs}
            />

            {isLessonsLoading ? (
                <div className={styles.lessonsList}>
                    <LessonDetailSkeleton />
                    <LessonDetailSkeleton />
                    <LessonDetailSkeleton />
                </div>
            ) : lessons.length === 0 ? (
                <EmptyLessonsState
                    onAddLesson={handleOpenModal}
                    filter={allLessonsCount === 0 ? 'all' : activeTab}
                />
            ) : (
                <LessonsList
                    lessons={lessons || []}
                    isLoading={isLessonsLoading}
                    isRefreshing={isLessonsRefreshing}
                    onTogglePaid={togglePaid}
                    onToggleCancel={toggleCancel}
                    onReschedule={handleRescheduleLesson}
                    onEdit={handleEditLesson}
                    onDelete={handleDeleteClick}
                />
            )}

            <LessonFormModal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                isEdit={!!editingLesson}
                formData={formData}
                setFormData={setFormData}
                students={students || []}
                subjects={subjects || []}
                isSubmitting={isSubmitting}
                error={error}
                onSubmit={() => submitForm(!!editingLesson, editingLesson?.id)}
                onStudentChange={handleStudentChange}
                onCreateStudent={handleCreateStudent}
                onCreateSubject={handleCreateSubject}
                handleChange={handleChange}
            />

            <DeleteLessonDialog
                isOpen={deleteConfirm.isOpen}
                onClose={() => setDeleteConfirm({ isOpen: false, lesson: null })}
                onConfirm={handleConfirmDelete}
                isSeries={!!deleteConfirm.lesson?.seriesId}
                isLoading={isLoading}
            />

            <RescheduleModal
                isOpen={isRescheduleModalOpen}
                onClose={() => setIsRescheduleModalOpen(false)}
                onConfirm={handleConfirmReschedule}
                currentDate={reschedulingLesson ? new Date(reschedulingLesson.date) : new Date()}
                isSubmitting={isLoading}
            />
        </div>
    )
}

export default function LessonsPage() {
    return (
        <Suspense fallback={<div>Загрузка...</div>}>
            <LessonsContent />
        </Suspense>
    )
}
