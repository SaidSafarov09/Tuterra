'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { addMonths, subMonths, format } from 'date-fns'
import { ru } from 'date-fns/locale'

import { Modal } from '@/components/ui/Modal'
import { MonthNavigation } from '@/components/common/MonthNavigation'
import { CalendarWeekDays } from '@/components/calendar/CalendarWeekDays'
import { CalendarGrid } from '@/components/calendar/CalendarGrid'
import { CalendarDayDetails } from '@/components/calendar/CalendarDayDetails'
import { LessonFormModal } from '@/components/lessons/LessonFormModal'

import { calculateDayData } from '@/lib/lessonUtils'
import { Lesson, DayData, Student, Subject } from '@/types'
import { toast } from 'sonner'
import { lessonsApi, studentsApi, subjectsApi } from '@/services/api'
import { LESSON_MESSAGES } from '@/constants/messages'
import { CalendarSkeleton } from '@/components/skeletons'
import { RescheduleModal } from '@/components/lessons/RescheduleModal'
import { useLessonForm } from '@/hooks/useLessonForm'

import styles from './page.module.scss'

export default function CalendarPage() {
    const router = useRouter()
    const isMobile = useMediaQuery('(max-width: 768px)')
    const [currentMonth, setCurrentMonth] = useState(new Date())
    const [selectedDate, setSelectedDate] = useState<Date | null>(null)
    const [lessons, setLessons] = useState<Lesson[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false)
    const [reschedulingLesson, setReschedulingLesson] = useState<Lesson | null>(null)

    const [students, setStudents] = useState<Student[]>([])
    const [subjects, setSubjects] = useState<Subject[]>([])

    useEffect(() => {
        fetchLessons()
        fetchStudents()
        fetchSubjects()
    }, [])

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

    const updateLessonOptimistic = (lessonId: string, updates: Partial<Lesson>) => {
        setLessons(prev => prev.map(lesson =>
            lesson.id === lessonId ? { ...lesson, ...updates } : lesson
        ))
    }

    const togglePaid = async (lesson: Lesson) => {
        const newIsPaid = !lesson.isPaid
        updateLessonOptimistic(lesson.id, { isPaid: newIsPaid })

        try {
            await lessonsApi.update(lesson.id, { isPaid: newIsPaid })
            toast.success(
                newIsPaid ? LESSON_MESSAGES.MARKED_PAID : LESSON_MESSAGES.MARKED_UNPAID
            )
        } catch (error) {
            updateLessonOptimistic(lesson.id, { isPaid: !newIsPaid })
            toast.error(LESSON_MESSAGES.UPDATE_ERROR)
        }
    }

    const toggleCancel = async (lesson: Lesson) => {
        const newIsCanceled = !lesson.isCanceled
        updateLessonOptimistic(lesson.id, { isCanceled: newIsCanceled })

        try {
            await lessonsApi.update(lesson.id, { isCanceled: newIsCanceled })
            toast.success(
                newIsCanceled ? LESSON_MESSAGES.CANCELED : LESSON_MESSAGES.RESTORED
            )
        } catch (error) {
            updateLessonOptimistic(lesson.id, { isCanceled: !newIsCanceled })
            toast.error(LESSON_MESSAGES.UPDATE_ERROR)
        }
    }

    const handleRescheduleLesson = (lesson: Lesson) => {
        setReschedulingLesson(lesson)
        setIsRescheduleModalOpen(true)
    }

    const handleConfirmReschedule = async (newDate: Date) => {
        if (!reschedulingLesson) return

        try {
            await lessonsApi.update(reschedulingLesson.id, {
                studentId: reschedulingLesson.student.id,
                subjectId: reschedulingLesson.subject?.id || '',
                date: newDate.toISOString(),
                price: reschedulingLesson.price,
                isPaid: reschedulingLesson.isPaid,
                topic: reschedulingLesson.topic || '',
                notes: reschedulingLesson.notes || '',
            })
            toast.success('Занятие перенесено')
            setIsRescheduleModalOpen(false)
            setReschedulingLesson(null)
            await fetchLessons()
        } catch (error) {
            toast.error('Не удалось перенести занятие')
        }
    }

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
                    <CalendarGrid
                        currentMonth={currentMonth}
                        lessons={lessons}
                        onDateClick={handleDayClick}
                    />
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
                />
            </Modal>

            <LessonFormModal
                isOpen={isCreateModalOpen}
                onClose={handleCloseCreateModal}
                isEdit={false}
                formData={formData}
                setFormData={setFormData}
                students={students}
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
                isSubmitting={isLoading}
            />
        </div>
    )
}
