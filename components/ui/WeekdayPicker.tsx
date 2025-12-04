'use client'

import React from 'react'
import styles from './WeekdayPicker.module.scss'
import { WEEKDAY_NAMES } from '@/types/recurring'

interface WeekdayPickerProps {
    value: number[] // Array of selected days (0-6)
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

    return (
        <div className={styles.container}>
            {WEEKDAY_NAMES.map((name, index) => (
                <button
                    key={index}
                    type="button"
                    className={`${styles.day} ${value.includes(index) ? styles.selected : ''} ${disabled ? styles.disabled : ''}`}
                    onClick={() => toggleDay(index)}
                    disabled={disabled}
                >
                    {name}
                </button>
            ))}
        </div>
    )
}
