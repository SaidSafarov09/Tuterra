'use client'

import React, { useEffect, useState, Suspense } from 'react'
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
import { Lesson, Student, Subject, LessonFilter } from '@/types'
import styles from './page.module.scss'

const TABS = [
    { id: 'upcoming', label: 'Предстоящие' },
    { id: 'past', label: 'Прошедшие' },
    { id: 'unpaid', label: 'Неоплаченные' },
    { id: 'canceled', label: 'Отмененные' },
]

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

    // Data Fetching
    const {
        data: lessons = [],
        isLoading: isLessonsLoading,
        refetch: refetchLessons
    } = useFetch<Lesson[]>(`/api/lessons?filter=${activeTab}`, [activeTab])

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
        deleteLesson
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
                tabs={TABS}
                activeTab={activeTab}
                onTabChange={handleTabChange}
                className={styles.tabs}
            />

            <LessonsList
                lessons={lessons || []}
                isLoading={isLessonsLoading}
                onTogglePaid={togglePaid}
                onToggleCancel={toggleCancel}
                onEdit={handleEditLesson}
                onDelete={handleDeleteClick}
            />

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
