'use client'

import React, { useState, useEffect } from 'react'
import styles from './Input.module.scss'

interface TimeInputProps {
    label?: string
    value: string // формат "HH:MM"
    onChange: (value: string) => void
    placeholder?: string
    disabled?: boolean
}

export const TimeInput: React.FC<TimeInputProps> = ({
    label,
    value,
    onChange,
    placeholder = '00:00',
    disabled = false
}) => {
    const [hours, setHours] = useState('')
    const [minutes, setMinutes] = useState('')

    // Парсим начальное значение
    useEffect(() => {
        if (value && value.includes(':')) {
            const [h, m] = value.split(':')
            setHours(h)
            setMinutes(m)
        }
    }, [value])

    const handleHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value.replace(/\D/g, '') // только цифры

        if (val.length > 2) val = val.slice(0, 2)

        const numVal = parseInt(val || '0', 10)
        if (numVal > 23) val = '23'

        setHours(val)

        // Обновляем общее значение
        const newMinutes = minutes || '00'
        onChange(`${val.padStart(2, '0')}:${newMinutes}`)
    }

    const handleMinutesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value.replace(/\D/g, '') // только цифры

        if (val.length > 2) val = val.slice(0, 2)

        const numVal = parseInt(val || '0', 10)
        if (numVal > 59) val = '59'

        setMinutes(val)

        // Обновляем общее значение
        const newHours = hours || '00'
        onChange(`${newHours.padStart(2, '0')}:${val.padStart(2, '0')}`)
    }

    const handleHoursBlur = () => {
        if (hours === '') {
            setHours('00')
            onChange(`00:${minutes.padStart(2, '0')}`)
        } else if (hours.length === 1) {
            const padded = hours.padStart(2, '0')
            setHours(padded)
            onChange(`${padded}:${minutes.padStart(2, '0')}`)
        }
    }

    const handleMinutesBlur = () => {
        if (minutes === '') {
            setMinutes('00')
            onChange(`${hours.padStart(2, '0')}:00`)
        } else if (minutes.length === 1) {
            const padded = minutes.padStart(2, '0')
            setMinutes(padded)
            onChange(`${hours.padStart(2, '0')}:${padded}`)
        }
    }

    return (
        <div className={styles.inputGroup}>
            {label && <label className={styles.label}>{label}</label>}
            <div className={styles.timeInputWrapper}>
                <input
                    type="text"
                    inputMode="numeric"
                    className={styles.timeInput}
                    value={hours}
                    onChange={handleHoursChange}
                    onBlur={handleHoursBlur}
                    placeholder="00"
                    maxLength={2}
                    disabled={disabled}
                />
                <span className={styles.timeSeparator}>:</span>
                <input
                    type="text"
                    inputMode="numeric"
                    className={styles.timeInput}
                    value={minutes}
                    onChange={handleMinutesChange}
                    onBlur={handleMinutesBlur}
                    placeholder="00"
                    maxLength={2}
                    disabled={disabled}
                />
            </div>
        </div>
    )
}
