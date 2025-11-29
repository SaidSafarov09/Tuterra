'use client'

import React, { useState } from 'react'
import { addMonths, subMonths, format } from 'date-fns'
import { ru } from 'date-fns/locale'

import { Modal } from '@/components/ui/Modal'
import { MonthNavigation } from '@/components/common/MonthNavigation'
import { CalendarWeekDays } from '@/components/calendar/CalendarWeekDays'
import { CalendarGrid } from '@/components/calendar/CalendarGrid'
import { CalendarDayDetails } from '@/components/calendar/CalendarDayDetails'
import { CalendarLessonForm } from '@/components/calendar/CalendarLessonForm'

import { useLessonActions } from '@/hooks/useLessonActions'
import { calculateDayEarnings } from '@/lib/lessonUtils'
import { Lesson, DayData } from '@/types'
import { useFetch } from '@/hooks/useFetch'

import styles from './page.module.scss'

export default function CalendarPage() {
    // State
    const [currentMonth, setCurrentMonth] = useState(new Date())
    const [selectedDate, setSelectedDate] = useState<Date | null>(null)

    // Modal State
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

    // Data Fetching
    const {
        data: fetchedLessons,
        isLoading,
        refetch: fetchLessons
    } = useFetch<Lesson[]>('/api/lessons')

    const lessons = fetchedLessons || []

    // Hooks
    const { togglePaid, toggleCancel } = useLessonActions(fetchLessons)

    // Handlers
    const handlePreviousMonth = () => setCurrentMonth(prev => subMonths(prev, 1))
    const handleNextMonth = () => setCurrentMonth(prev => addMonths(prev, 1))

    const handleDateClick = (date: Date) => {
        setSelectedDate(date)
        setIsDetailsModalOpen(true)
    }

    const handleCloseDetails = () => {
        setIsDetailsModalOpen(false)
        setSelectedDate(null)
    }

    const handleOpenCreateModal = () => {
        setIsDetailsModalOpen(false)
        setIsCreateModalOpen(true)
    }

    const handleCloseCreateModal = () => {
        setIsCreateModalOpen(false)
        // Re-open details modal if we have a selected date
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

    // Derived Data
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
                    onDateClick={handleDateClick}
                />
            </div>

            {/* Details Modal */}
            <Modal
                isOpen={isDetailsModalOpen}
                onClose={handleCloseDetails}
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

            {/* Create Lesson Modal */}
            <Modal
                isOpen={isCreateModalOpen}
                onClose={handleCloseCreateModal}
                title="Новое занятие"
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
