'use client'

import React from 'react'
import TimePicker from 'react-time-picker'
import 'react-time-picker/dist/TimePicker.css'
import 'react-clock/dist/Clock.css'
import styles from './Input.module.scss'

interface TimeInputProps {
    label?: string
    value: string // формат "HH:MM"
    onChange: (value: string) => void
    disabled?: boolean
}

export const TimeInput: React.FC<TimeInputProps> = ({
    label,
    value,
    onChange,
    disabled = false
}) => {
    const handleChange = (val: string | null) => {
        if (val) {
            onChange(val)
        }
    }

    return (
        <div className={styles.inputGroup} onClick={(e) => e.stopPropagation()}>
            {label && <label className={styles.label}>{label}</label>}
            <div className={styles.timeInputWrapper}>
                <TimePicker
                    onChange={handleChange}
                    value={value || '00:00'}
                    disableClock={true}
                    clearIcon={null}
                    clockIcon={null}
                    format="HH:mm"
                    disabled={disabled}
                    locale="ru-RU"
                />
            </div>
        </div>
    )
}
