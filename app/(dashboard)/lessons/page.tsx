'use client'

import React, { useEffect, useState, Suspense, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { PlusIcon } from '@/components/icons/Icons'
import { TabNav } from '@/components/ui/TabNav'
import { LessonsList } from '@/components/lessons/LessonsList'
import { LessonFormModal } from '@/components/lessons/LessonFormModal'
import { useLessonActions } from '@/hooks/useLessonActions'
import { useLessonForm } from '@/hooks/useLessonForm'
import { useFetch } from '@/hooks/useFetch'
import { useLessonsByTab } from '@/hooks/useLessonsByTab'
import { Lesson, Student, Subject, LessonFilter } from '@/types'
import styles from './page.module.scss'
import { LESSON_TABS } from '@/constants'
import { LessonDetailSkeleton } from '@/components/skeletons'
import { EmptyLessonsState } from '@/components/lessons/EmptyLessonsState'


function LessonsContent() {
    const router = useRouter()
    const searchParams = useSearchParams()

    // State
    const [activeTab, setActiveTab] = useState<LessonFilter>('upcoming')
    const [isOpen, setIsOpen] = useState(false)
    const [editingLesson, setEditingLesson] = useState<Lesson | null>(null)
    const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; lessonId: string | null }>({
        isOpen: false,
        lessonId: null,
    })

    // Data Fetching with caching
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

    // Hooks
    const {
        togglePaid,
        toggleCancel,
        deleteLesson,
        isLoading,
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

    // Create tabs with counts using useMemo
    const tabsWithCounts = useMemo(() =>
        LESSON_TABS.map(tab => ({
            ...tab,
            count: lessonsCounts[tab.id as keyof typeof lessonsCounts]
        })),
        [lessonsCounts]
    )

    // Effects
    useEffect(() => {
        const tab = searchParams.get('tab') as LessonFilter
        if (tab && ['upcoming', 'past', 'unpaid', 'canceled'].includes(tab)) {
            setActiveTab(tab)
        }
    }, [searchParams])

    // Handlers
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
        setDeleteConfirm({ isOpen: true, lessonId })
    }

    const handleConfirmDelete = async () => {
        if (deleteConfirm.lessonId) {
            await deleteLesson(deleteConfirm.lessonId)
            setDeleteConfirm({ isOpen: false, lessonId: null })
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

            <ConfirmDialog
                isOpen={deleteConfirm.isOpen}
                onClose={() => setDeleteConfirm({ isOpen: false, lessonId: null })}
                onConfirm={handleConfirmDelete}
                title="Удалить занятие?"
                message="Вы уверены, что хотите удалить это занятие? Это действие нельзя отменить."
                confirmText="Удалить"
                cancelText="Отмена"
                variant="danger"
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
