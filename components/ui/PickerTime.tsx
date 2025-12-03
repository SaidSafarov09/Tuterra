'use client'

import React, { useState } from 'react'
import styles from './DateTimePicker.module.scss'

interface TimePickerProps {
  value?: Date
  onChange: (date: Date) => void
 className?: string
}

export const PickerTime: React.FC<TimePickerProps> = ({ 
  value, 
  onChange,
  className = ''
}) => {
 const [hours, setHours] = useState(value ? value.getHours().toString().padStart(2, '0') : '12')
  const [minutes, setMinutes] = useState(value ? value.getMinutes().toString().padStart(2, '0') : '00')

 const handleHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.max(0, Math.min(23, parseInt(e.target.value) || 0))
    const paddedVal = val.toString().padStart(2, '0')
    setHours(paddedVal)
    
    if (value) {
      const newDate = new Date(value)
      newDate.setHours(parseInt(paddedVal), value.getMinutes())
      onChange(newDate)
    } else {
      const newDate = new Date()
      newDate.setHours(parseInt(paddedVal), 0)
      onChange(newDate)
    }
  }

  const handleMinutesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.max(0, Math.min(59, parseInt(e.target.value) || 0))
    const paddedVal = val.toString().padStart(2, '0')
    setMinutes(paddedVal)
    
    if (value) {
      const newDate = new Date(value)
      newDate.setHours(value.getHours(), parseInt(paddedVal))
      onChange(newDate)
    } else {
      const newDate = new Date()
      newDate.setHours(12, parseInt(paddedVal))
      onChange(newDate)
    }
  }

  return (
    <div className={`${styles.timePicker} ${className}`}>
      <div className={styles.timeLabel}>Время</div>
      <div className={styles.timeInputs}>
        <input
          type="number"
          className={styles.timeInput}
          value={hours}
          onChange={handleHoursChange}
          min="00"
          max="23"
        />
        <span className={styles.timeSeparator}>:</span>
        <input
          type="number"
          className={styles.timeInput}
          value={minutes}
          onChange={handleMinutesChange}
          min="00"
          max="59"
        />
      </div>
    </div>
  )
}