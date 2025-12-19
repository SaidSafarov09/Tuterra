'use client'

import React, { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { addMonths, subMonths, format } from 'date-fns'
import { ru } from 'date-fns/locale'

import { Modal } from '@/components/ui/Modal'
import { MonthNavigation } from '@/components/common/MonthNavigation'
import { CalendarWeekDays } from '@/components/calendar/CalendarWeekDays'
import { CalendarGrid } from '@/components/calendar/CalendarGrid'

import dynamic from 'next/dynamic'
const LessonFormModal = dynamic(() => import('@/components/lessons/LessonFormModal').then(mod => mod.LessonFormModal), { ssr: false })
const RescheduleModal = dynamic(() => import('@/components/lessons/RescheduleModal').then(mod => mod.RescheduleModal), { ssr: false })
const GroupPaymentModal = dynamic(() => import('@/components/lessons/GroupPaymentModal').then(mod => mod.GroupPaymentModal), { ssr: false })
const CalendarDayDetails = dynamic(() => import('@/components/calendar/CalendarDayDetails').then(mod => mod.CalendarDayDetails), { ssr: false })

import { calculateDayData } from '@/lib/lessonUtils'
import { Lesson, DayData, Student, Subject, Group } from '@/types'
import { toast } from 'sonner'
import { lessonsApi, studentsApi, subjectsApi, groupsApi } from '@/services/api'
import { LESSON_MESSAGES } from '@/constants/messages'
import { CalendarSkeleton } from '@/components/skeletons'
import { useLessonForm } from '@/hooks/useLessonForm'
import { useLessonActions } from '@/hooks/useLessonActions'
import { useAuthStore } from '@/store/auth'

import styles from './page.module.scss'

export default function CalendarPage() {
    const { user } = useAuthStore()
    const userBirthDate = user?.birthDate
    const userRegion = user?.region
    const router = useRouter()
    const isMobile = useMediaQuery('(max-width: 768px)')
    const [currentMonth, setCurrentMonth] = useState(new Date())
    const [selectedDate, setSelectedDate] = useState<Date | null>(null)
    const [lessons, setLessons] = useState<Lesson[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)



    const [students, setStudents] = useState<Student[]>([])
    const [subjects, setSubjects] = useState<Subject[]>([])
    const [groups, setGroups] = useState<Group[]>([])

    const fetchGroups = async () => {
        try {
            const data = await groupsApi.getAll()
            setGroups(data)
        } catch (error) {
            console.error('Failed to fetch groups:', error)
        }
    }

    const fetchLessons = async () => {
        setIsLoading(true)
        try {
            const data = await lessonsApi.getAll()
            setLessons(data)
        } catch (error) {
            console.error('Failed to fetch lessons:', error)
            toast.error(LESSON_MESSAGES.FETCH_ERROR)
        } finally {
            setIsLoading(false)
        }
    }

    const fetchStudents = async () => {
        try {
            const data = await studentsApi.getAll()
            setStudents(data)
        } catch (error) {
            console.error('Failed to fetch students:', error)
        }
    }

    const fetchSubjects = async () => {
        try {
            const data = await subjectsApi.getAll()
            setSubjects(data)
        } catch (error) {
            console.error('Failed to fetch subjects:', error)
        }
    }

    const {
        togglePaid,
        toggleCancel,
        handleRescheduleLesson,
        handleConfirmReschedule,
        isLoading: isActionsLoading,
        isRescheduleModalOpen,
        setIsRescheduleModalOpen,
        reschedulingLesson,
        isGroupPaymentModalOpen,
        setIsGroupPaymentModalOpen,
        paymentLesson,
    } = useLessonActions(fetchLessons)

    useEffect(() => {
        fetchLessons()
        fetchStudents()
        fetchSubjects()
        fetchGroups()
    }, [])



    const handlePreviousMonth = () => {
        setCurrentMonth(subMonths(currentMonth, 1))
    }

    const handleNextMonth = () => {
        setCurrentMonth(addMonths(currentMonth, 1))
    }

    const handleDayClick = (date: Date) => {
        setSelectedDate(date)
        setIsDetailsModalOpen(true)
    }

    const handleCloseDetailsModal = () => {
        setIsDetailsModalOpen(false)
        setSelectedDate(null)
    }

    const handleOpenCreateModal = () => {
        setIsDetailsModalOpen(false)
        if (selectedDate) {
            loadLessonWithDate(selectedDate)
        }
        setIsCreateModalOpen(true)
    }

    const handleCloseCreateModal = () => {
        setIsCreateModalOpen(false)
        resetForm()
        if (selectedDate) {
            setIsDetailsModalOpen(true)
        }
    }

    const handleCreateSuccess = () => {
        fetchLessons()
        setIsCreateModalOpen(false)
        resetForm()
        if (selectedDate) {
            setIsDetailsModalOpen(true)
        }
    }

    const {
        formData,
        setFormData,
        isSubmitting,
        error,
        handleChange,
        handleStudentChange,
        handleCreateStudent,
        handleCreateSubject,
        handleSubmit,
        loadLessonWithDate,
        resetForm,
    } = useLessonForm(handleCreateSuccess, fetchStudents, fetchSubjects)

    const selectedDayData: DayData | null = selectedDate
        ? calculateDayData(lessons, selectedDate)
        : null

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.headerText}>
                    <h1 className={styles.title}>Календарь</h1>
                    <p className={styles.subtitle}>Планирование занятий</p>
                </div>
            </div>

            {isLoading ? (
                <CalendarSkeleton />
            ) : (
                <div className={styles.calendarContainer}>
                    <MonthNavigation
                        currentMonth={currentMonth}
                        onPreviousMonth={handlePreviousMonth}
                        onNextMonth={handleNextMonth}
                    />

                    <CalendarWeekDays />
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentMonth.toISOString()}
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            transition={{ duration: 0.2 }}
                        >
                            <CalendarGrid
                                currentMonth={currentMonth}
                                lessons={lessons}
                                onDateClick={handleDayClick}
                                userBirthDate={userBirthDate}
                                region={userRegion}
                            />
                        </motion.div>
                    </AnimatePresence>
                </div>
            )}

            <Modal
                maxWidth={isMobile ? "100%" : "650px"}
                isOpen={isDetailsModalOpen}
                onClose={handleCloseDetailsModal}
                title={selectedDate ? format(selectedDate, 'd MMMM yyyy', { locale: ru }) : ''}
            >
                <CalendarDayDetails
                    date={selectedDate}
                    dayData={selectedDayData}
                    isLoading={isLoading}
                    onAddLesson={handleOpenCreateModal}
                    onTogglePaid={togglePaid}
                    onToggleCancel={toggleCancel}
                    onReschedule={handleRescheduleLesson}
                    userBirthDate={userBirthDate}
                    region={userRegion}
                />
            </Modal>

            <LessonFormModal
                isOpen={isCreateModalOpen}
                onClose={handleCloseCreateModal}
                isEdit={false}
                formData={formData}
                setFormData={setFormData}
                students={students}
                groups={groups}
                subjects={subjects}
                isSubmitting={isSubmitting}
                error={error}
                onSubmit={() => handleSubmit(false)}
                onStudentChange={handleStudentChange}
                onCreateStudent={handleCreateStudent}
                onCreateSubject={handleCreateSubject}
                handleChange={handleChange}
                customTitle={selectedDate ? `Новое занятие на ${format(selectedDate, 'd MMMM', { locale: ru })}` : undefined}
            />

            <RescheduleModal
                isOpen={isRescheduleModalOpen}
                onClose={() => setIsRescheduleModalOpen(false)}
                onConfirm={handleConfirmReschedule}
                currentDate={reschedulingLesson ? new Date(reschedulingLesson.date) : new Date()}
                isSubmitting={isActionsLoading}
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
                        fetchLessons()
                    } catch (error) {
                        toast.error('Ошибка при обновлении статуса оплаты')
                    }
                }}
                students={paymentLesson?.group?.students || []}
                initialPaidStudentIds={paymentLesson?.lessonPayments?.filter((p: any) => p.hasPaid).map((p: any) => p.studentId) || []}
                initialAttendedStudentIds={paymentLesson?.lessonPayments?.map((p: any) => p.studentId) || []}
                isSubmitting={isActionsLoading}
                price={Number(paymentLesson?.price || 0)}
                lessonDate={paymentLesson?.date}
            />
        </div>
    )
}
