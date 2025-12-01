'use client'

import React, { useState, useEffect } from 'react'
import { addMonths, subMonths, format } from 'date-fns'
import { ru } from 'date-fns/locale'

import { Modal } from '@/components/ui/Modal'
import { MonthNavigation } from '@/components/common/MonthNavigation'
import { CalendarWeekDays } from '@/components/calendar/CalendarWeekDays'
import { CalendarGrid } from '@/components/calendar/CalendarGrid'
import { CalendarDayDetails } from '@/components/calendar/CalendarDayDetails'
import { CalendarLessonForm } from '@/components/calendar/CalendarLessonForm'

import { calculateDayEarnings } from '@/lib/lessonUtils'
import { Lesson, DayData } from '@/types'
import { toast } from 'sonner'
import { lessonsApi } from '@/services/api'
import { LESSON_MESSAGES } from '@/constants/messages'
import { CalendarSkeleton } from '@/components/skeletons'

import styles from './page.module.scss'

export default function CalendarPage() {
    const [currentMonth, setCurrentMonth] = useState(new Date())
    const [selectedDate, setSelectedDate] = useState<Date | null>(null)
    const [lessons, setLessons] = useState<Lesson[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

    useEffect(() => {
        fetchLessons()
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
        setIsCreateModalOpen(true)
    }

    const handleCloseCreateModal = () => {
        setIsCreateModalOpen(false)
        if (selectedDate) {
            setIsDetailsModalOpen(true)
        }
    }

    const handleCreateSuccess = () => {
        fetchLessons()
        setIsCreateModalOpen(false)
        if (selectedDate) {
            setIsDetailsModalOpen(true)
        }
    }

    const selectedDayData: DayData | null = selectedDate
        ? calculateDayEarnings(lessons, selectedDate)
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
                />
            </Modal>

            <Modal
                isOpen={isCreateModalOpen}
                onClose={handleCloseCreateModal}
                title={selectedDate ? `Новое занятие на ${format(selectedDate, 'd MMMM', { locale: ru })}` : 'Новое занятие'}
            >
                {selectedDate && (
                    <CalendarLessonForm
                        initialDate={selectedDate}
                        onSuccess={handleCreateSuccess}
                        onCancel={handleCloseCreateModal}
                    />
                )}
            </Modal>
        </div>
    )
}
