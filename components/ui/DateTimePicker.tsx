'use client'

import React, { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import styles from './DateTimePicker.module.scss'
import { CalendarIcon, ClockIcon } from '@/components/icons/Icons'
import { PickerCalendar } from './PickerCalendar'
import { PickerTime } from './PickerTime'
import { PickerActions } from './PickerActions'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'

interface DateTimePickerProps {
    label?: string
    value?: Date
    onChange: (date: Date) => void
    minDate?: Date
    maxDate?: Date
    showTime?: boolean
    timeOnly?: boolean
    disabled?: boolean
    required?: boolean
    error?: string
    placeholder?: string
    dropDirection?: 'up' | 'down' | 'center'
}

export const DateTimePicker: React.FC<DateTimePickerProps> = ({
    label,
    value,
    onChange,
    minDate,
    maxDate,
    showTime = true,
    timeOnly = false,
    disabled = false,
    required = false,
    error,
    placeholder = 'Выберите дату и время',
    dropDirection = 'center',
}) => {
    const [isOpen, setIsOpen] = useState(false)
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(value || undefined)
    const containerRef = useRef<HTMLDivElement>(null)
    const pickerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        
        setSelectedDate(value)
    }, [value])

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            
            const target = event.target as Node
            
            const isOutsideContainer = containerRef.current && !containerRef.current.contains(target)
            const isOutsidePicker = dropDirection === 'center' && pickerRef.current && !pickerRef.current.contains(target)
            
            if (isOutsideContainer && (dropDirection !== 'center' || isOutsidePicker)) {
                setIsOpen(false)
            }
        }

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside)
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [isOpen, dropDirection])

    const handleDateChange = (date: Date) => {
        setSelectedDate(date)
        onChange(date)
    }

    const handleConfirm = () => {
        if (selectedDate) {
            onChange(selectedDate)
        }
        setIsOpen(false)
    }

    const handleCancel = () => {
        setIsOpen(false)
    }

    const renderPickerContent = () => (
        <div ref={pickerRef} className={`${styles.picker} ${styles.pickerCenter} ${timeOnly ? styles.timeOnlyPicker : ''}`}>
            {!timeOnly && (
                <PickerCalendar
                    value={selectedDate}
                    onChange={handleDateChange}
                    minDate={minDate}
                    maxDate={maxDate}
                />
            )}
            
            {(showTime || timeOnly) && (
                <PickerTime
                    value={selectedDate}
                    onChange={handleDateChange}
                />
            )}
            
            <PickerActions
                onCancel={handleCancel}
                onConfirm={handleConfirm}
            />
        </div>
    )

    return (
        <div className={styles.container} ref={containerRef}>
            {label && (
                <label className={styles.label}>
                    {label}
                    {required && <span className={styles.required}>*</span>}
                </label>
            )}

            <div
                className={`${styles.input} ${isOpen ? styles.focused : ''} ${error ? styles.error : ''
                    } ${disabled ? styles.disabled : ''}`}
                onClick={() => !disabled && setIsOpen(!isOpen)}
            >
                <span className={styles.icon}>
                    {timeOnly ? <ClockIcon size={18} /> : <CalendarIcon size={18} />}
                </span>
                <span className={value ? styles.value : styles.placeholder}>
                    {value
                        ? format(
                            value,
                            timeOnly ? 'HH:mm' : (showTime ? 'dd MMMM yyyy, HH:mm' : 'dd MMMM yyyy'),
                            { locale: ru }
                        )
                        : placeholder}
                </span>
                {showTime && !timeOnly && (
                    <span className={styles.icon}>
                        <ClockIcon size={18} />
                    </span>
                )}
            </div>

            {isOpen && (
                <>
                    {dropDirection === 'center' && (
                        createPortal(
                            <div className={styles.overlay} onClick={handleCancel} />,
                            document.body
                        )
                    )}
                    {dropDirection === 'center' ? (
                        createPortal(
                            renderPickerContent(),
                            document.body
                        )
                    ) : (
                        renderPickerContent()
                    )}
                </>
            )}

            {error && <div className={styles.errorMessage}>{error}</div>}
        </div>
    )
}
