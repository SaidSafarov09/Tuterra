import React from 'react'
import { Dropdown } from './Dropdown'

interface TimeSelectProps {
    value: Date | undefined
    onChange: (date: Date) => void
    disabled?: boolean
    label?: string
}

export const TimeSelect: React.FC<TimeSelectProps> = ({ value, onChange, disabled, label }) => {
    const generateTimeOptions = () => {
        const options = []
        for (let hour = 0; hour < 24; hour++) {
            for (let minute = 0; minute < 60; minute += 30) { // Шаг 30 минут по умолчанию, можно сделать пропсом
                const timeString = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
                options.push({ value: timeString, label: timeString })
            }
        }
        return options
    }

    const options = generateTimeOptions()

    // Если текущее время не кратно 30 минутам, добавляем его в опции
    const currentTimeString = value
        ? `${String(value.getHours()).padStart(2, '0')}:${String(value.getMinutes()).padStart(2, '0')}`
        : ''

    if (currentTimeString && !options.find(o => o.value === currentTimeString)) {
        options.push({ value: currentTimeString, label: currentTimeString })
        options.sort((a, b) => a.value.localeCompare(b.value))
    }

    const handleChange = (timeString: string) => {
        const [hours, minutes] = timeString.split(':').map(Number)
        const newDate = value ? new Date(value) : new Date()
        newDate.setHours(hours)
        newDate.setMinutes(minutes)
        newDate.setSeconds(0)
        newDate.setMilliseconds(0)
        onChange(newDate)
    }

    return (
        <Dropdown
            label={label}
            options={options}
            value={currentTimeString}
            onChange={handleChange}
            placeholder="Время"
            disabled={disabled}
            searchable={false}
        />
    )
}
