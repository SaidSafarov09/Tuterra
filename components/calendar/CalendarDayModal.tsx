import React from 'react'
import { Modal } from '@/components/ui/Modal'
import { CalendarDayDetails } from './CalendarDayDetails'
import { DayData, Lesson } from '@/types'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'

interface CalendarDayModalProps {
    isOpen: boolean
    onClose: () => void
    date: Date | null
    dayData: DayData | null
    isLoading: boolean
    onAddLesson: () => void
    onTogglePaid: (lesson: Lesson) => void
    onToggleCancel: (lesson: Lesson) => void
    onReschedule: (lesson: Lesson) => void
}

export const CalendarDayModal: React.FC<CalendarDayModalProps> = ({
    isOpen,
    onClose,
    date,
    dayData,
    isLoading,
    onAddLesson,
    onTogglePaid,
    onToggleCancel,
    onReschedule
}) => {
    const title = date ? format(date, 'd MMMM yyyy', { locale: ru }) : ''

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            maxWidth="600px"
        >
            <CalendarDayDetails
                date={date}
                dayData={dayData}
                isLoading={isLoading}
                onAddLesson={onAddLesson}
                onTogglePaid={onTogglePaid}
                onToggleCancel={onToggleCancel}
                onReschedule={onReschedule}
            />
        </Modal>
    )
}
