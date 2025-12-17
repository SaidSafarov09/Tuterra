'use client'

import React, { useEffect, useState, Suspense, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { PlusIcon } from '@/components/icons/Icons'
import { TabNav } from '@/components/ui/TabNav'
import { LessonsList } from '@/components/lessons/LessonsList'

import dynamic from 'next/dynamic'
const LessonFormModal = dynamic(() => import('@/components/lessons/LessonFormModal').then(mod => mod.LessonFormModal), { ssr: false })
const DeleteLessonDialog = dynamic(() => import('@/components/lessons/DeleteLessonDialog').then(mod => mod.DeleteLessonDialog), { ssr: false })
const RescheduleModal = dynamic(() => import('@/components/lessons/RescheduleModal').then(mod => mod.RescheduleModal), { ssr: false })
const GroupPaymentModal = dynamic(() => import('@/components/lessons/GroupPaymentModal').then(mod => mod.GroupPaymentModal), { ssr: false })

import { useLessonActions } from '@/hooks/useLessonActions'
import { useLessonForm } from '@/hooks/useLessonForm'
import { useFetch } from '@/hooks/useFetch'
import { useLessonsByTab } from '@/hooks/useLessonsByTab'
import { Lesson, Student, Subject, Group, LessonFilter } from '@/types'
import styles from './page.module.scss'
import { LESSON_TABS } from '@/constants'
import { LessonDetailSkeleton } from '@/components/skeletons'
import { EmptyLessonsState } from '@/components/lessons/EmptyLessonsState'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { lessonsApi } from '@/services/api'
import { toast } from 'sonner'


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
        data: groups = [],
        refetch: refetchGroups
    } = useFetch<Group[]>('/api/groups')

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
        isGroupPaymentModalOpen,
        setIsGroupPaymentModalOpen,
        paymentLesson,
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

    const isMobile = useMediaQuery('(max-width: 768px)')

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

    const handleRescheduleClick = (lesson: Lesson) => {
        handleRescheduleLesson(lesson)
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
                    filter="all"
                />
            ) : (
                <LessonsList
                    lessons={lessons || []}
                    isLoading={isLessonsLoading}
                    isRefreshing={isLessonsRefreshing}
                    onTogglePaid={togglePaid}
                    onToggleCancel={toggleCancel}
                    onReschedule={handleRescheduleClick}
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
                groups={groups || []}
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

            <GroupPaymentModal
                isOpen={isGroupPaymentModalOpen}
                onClose={() => setIsGroupPaymentModalOpen(false)}
                onSubmit={async (paidStudentIds, attendedStudentIds) => {
                    if (!paymentLesson) return
                    try {
                        await lessonsApi.update(paymentLesson.id, { paidStudentIds, attendedStudentIds })
                        if (attendedStudentIds.length === 0) {
                            toast.warning('Никто не пришел на занятие. Занятие отменено.')
                        } else {
                            toast.success('Статус оплаты обновлен')
                        }
                        setIsGroupPaymentModalOpen(false)
                        refetchLessons()
                    } catch (error) {
                        toast.error('Ошибка при обновлении статуса оплаты')
                    }
                }}
                students={paymentLesson?.group?.students || []}
                initialPaidStudentIds={paymentLesson?.lessonPayments?.filter((p: any) => p.hasPaid).map((p: any) => p.studentId) || []}
                initialAttendedStudentIds={paymentLesson?.lessonPayments?.map((p: any) => p.studentId) || []}
                isSubmitting={isLoading}
                price={Number(paymentLesson?.price || 0)}
                lessonDate={paymentLesson?.date}
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
