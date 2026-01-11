import React from 'react'
import { TimeInput } from './TimeInput'

interface TimeSelectProps {
    value: Date | undefined
    onChange: (date: Date) => void
    disabled?: boolean
    label?: string
}

export const TimeSelect: React.FC<TimeSelectProps> = ({ value, onChange, disabled, label }) => {
    const currentTimeString = value
        ? `${String(value.getHours()).padStart(2, '0')}:${String(value.getMinutes()).padStart(2, '0')}`
        : '00:00'

    const handleChange = (timeString: string) => {
        const [hours, minutes] = timeString.split(':').map(Number)
        const newDate = value ? new Date(value) : new Date()
        newDate.setHours(hours || 0)
        newDate.setMinutes(minutes || 0)
        newDate.setSeconds(0)
        newDate.setMilliseconds(0)
        onChange(newDate)
    }

    return (
        <TimeInput
            label={label}
            value={currentTimeString}
            onChange={handleChange}
            disabled={disabled}
        />
    )
}
