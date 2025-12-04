import { useState } from 'react'
import type { RecurrenceRule } from '@/types/recurring'

interface DateTimeRecurrenceState {
    date: Date | undefined
    recurrence: RecurrenceRule | undefined
}

export function useDateTimeRecurrence(initialDate?: Date, initialRecurrence?: RecurrenceRule) {
    const [isOpen, setIsOpen] = useState(false)
    const [tempState, setTempState] = useState<DateTimeRecurrenceState>({
        date: initialDate,
        recurrence: initialRecurrence,
    })

    const open = (currentDate?: Date, currentRecurrence?: RecurrenceRule) => {
        setTempState({
            date: currentDate || new Date(),
            recurrence: currentRecurrence,
        })
        setIsOpen(true)
    }

    const close = () => {
        setIsOpen(false)
    }

    const updateDate = (date: Date | undefined) => {
        setTempState(prev => ({ ...prev, date }))
    }

    const updateRecurrence = (recurrence: RecurrenceRule | undefined) => {
        setTempState(prev => ({ ...prev, recurrence }))
    }

    return {
        isOpen,
        tempState,
        open,
        close,
        updateDate,
        updateRecurrence,
    }
}
