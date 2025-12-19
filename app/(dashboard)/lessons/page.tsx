'use client'

import React, { useEffect, useState, Suspense, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { PlusIcon } from '@/components/icons/Icons'
import { TabNav } from '@/components/ui/TabNav'
import { LessonsList } from '@/components/lessons/LessonsList'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { Dropdown } from '@/components/ui/Dropdown'
import { AnimatePresence, motion } from 'framer-motion'

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
    const [selectedMonth, setSelectedMonth] = useState<string>('all')
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

    const monthOptions = useMemo(() => {
        const options: any[] = [{ value: 'all', label: 'Все занятия' }]
        const currentYear = new Date().getFullYear()

        const lessonsYears = lessons.map(l => new Date(l.date).getFullYear())
        const availableYears = Array.from(new Set([currentYear, ...lessonsYears])).sort((a, b) => b - a)

        availableYears.forEach(year => {
            const monthsInYear = []
            for (let m = 11; m >= 0; m--) {
                const date = new Date(year, m, 1)
                monthsInYear.push({
                    value: format(date, 'yyyy-MM'),
                    label: format(date, 'LLLL', { locale: ru })
                })
            }
            options.push({
                label: year.toString(),
                options: monthsInYear
            })
        })
        return options
    }, [lessons])

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

        const month = searchParams.get('month')
        if (month) {
            setSelectedMonth(month)
        } else {
            setSelectedMonth('all')
        }
    }, [searchParams])

    const filteredLessons = useMemo(() => {
        if (selectedMonth === 'all') return lessons
        return lessons.filter(lesson => format(new Date(lesson.date), 'yyyy-MM') === selectedMonth)
    }, [lessons, selectedMonth])

    const handleTabChange = (id: string) => {
        setActiveTab(id as LessonFilter)
        const params = new URLSearchParams(searchParams.toString())
        params.set('tab', id)
        router.push(`/lessons?${params.toString()}`)
    }

    const handleMonthChange = (month: string) => {
        setSelectedMonth(month)
        const params = new URLSearchParams(searchParams.toString())
        if (month === 'all') {
            params.delete('month')
        } else {
            params.set('month', month)
        }
        router.push(`/lessons?${params.toString()}`)
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

            <div className={styles.filterSection}>
                <TabNav
                    tabs={tabsWithCounts}
                    activeTab={activeTab}
                    onTabChange={handleTabChange}
                    className={styles.tabs}
                />
                {!isMobile && (
                    <div className={styles.monthFilter}>
                        <Dropdown
                            value={selectedMonth}
                            onChange={handleMonthChange}
                            options={monthOptions}
                            placeholder="Все время"
                            className={styles.monthDropdown}
                        />
                    </div>
                )}
            </div>

            {isMobile && (
                <div className={styles.monthFilterMobile}>
                    <Dropdown
                        value={selectedMonth}
                        onChange={handleMonthChange}
                        options={monthOptions}
                        placeholder="Все время"
                        className={styles.monthDropdown}
                    />
                </div>
            )}

            <AnimatePresence mode="wait">
                {isLessonsLoading ? (
                    <motion.div
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={styles.lessonsList}
                    >
                        <LessonDetailSkeleton />
                        <LessonDetailSkeleton />
                        <LessonDetailSkeleton />
                    </motion.div>
                ) : filteredLessons.length === 0 ? (
                    <motion.div
                        key="empty"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <EmptyLessonsState
                            onAddLesson={handleOpenModal}
                            filter={activeTab}
                        />
                    </motion.div>
                ) : (
                    <motion.div
                        key={`${activeTab}-${selectedMonth}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        <LessonsList
                            lessons={filteredLessons || []}
                            isLoading={isLessonsLoading}
                            isRefreshing={isLessonsRefreshing}
                            onTogglePaid={togglePaid}
                            onToggleCancel={toggleCancel}
                            onReschedule={handleRescheduleClick}
                            onEdit={handleEditLesson}
                            onDelete={handleDeleteClick}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

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
