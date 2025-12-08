'use client'

import React from 'react'
import styles from './WeekdayPicker.module.scss'
import { WEEKDAY_NAMES } from '@/types/recurring'

interface WeekdayPickerProps {
    value: number[] 
    onChange: (days: number[]) => void
    disabled?: boolean
}

export const WeekdayPicker: React.FC<WeekdayPickerProps> = ({
    value = [],
    onChange,
    disabled = false
}) => {
    const toggleDay = (day: number) => {
        if (disabled) return

        const newValue = value.includes(day)
            ? value.filter(d => d !== day)
            : [...value, day].sort((a, b) => a - b)

        onChange(newValue)
    }

    
    const orderedDays = [1, 2, 3, 4, 5, 6, 0]

    return (
        <div className={styles.container}>
            {orderedDays.map((dayIndex) => (
                <button
                    key={dayIndex}
                    type="button"
                    className={`${styles.day} ${value.includes(dayIndex) ? styles.selected : ''} ${disabled ? styles.disabled : ''}`}
                    onClick={() => toggleDay(dayIndex)}
                    disabled={disabled}
                >
                    {WEEKDAY_NAMES[dayIndex]}
                </button>
            ))}
        </div>
    )
}
