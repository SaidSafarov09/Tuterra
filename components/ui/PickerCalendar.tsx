'use client'

import React, { useState } from 'react'
import styles from './DateTimePicker.module.scss'
import { ArrowLeftIcon, ArrowRightIcon } from '@/components/icons/Icons'
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday } from 'date-fns'
import { ru } from 'date-fns/locale'

interface CalendarProps {
  value?: Date
  onChange: (date: Date) => void
  minDate?: Date
  maxDate?: Date
 className?: string
}

export const PickerCalendar: React.FC<CalendarProps> = ({ 
  value, 
  onChange, 
  minDate, 
  maxDate,
  className = ''
}) => {
  const [currentMonth, setCurrentMonth] = useState(value || new Date())

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const firstDayOfWeek = monthStart.getDay()
  const adjustedFirstDay = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1

  const previousMonthDays = adjustedFirstDay > 0
    ? eachDayOfInterval({
        start: subMonths(monthStart, 1),
        end: addMonths(subMonths(monthStart, 1), 0),
      }).slice(-adjustedFirstDay)
    : []

  const allDays = [...previousMonthDays, ...days]
  const remainingDays = 42 - allDays.length
  const nextMonthDays = remainingDays > 0
    ? eachDayOfInterval({
        start: addMonths(monthEnd, 1),
        end: addMonths(monthEnd, 1),
      }).slice(0, remainingDays)
    : []

  const calendarDays = [...allDays, ...nextMonthDays]

  const handleDayClick = (day: Date) => {
    if (value) {
      const newDate = new Date(day)
      newDate.setHours(value.getHours(), value.getMinutes())
      onChange(newDate)
    } else {
      const newDate = new Date(day)
      newDate.setHours(12, 0)
      onChange(newDate)
    }
  }

  const isDayDisabled = (day: Date) => {
    if (minDate && day < minDate) return true
    if (maxDate && day > maxDate) return true
    return false
 }

  return (
    <div className={`${className}`}>
      <div className={styles.header}>
        <button
          className={styles.navButton}
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
        >
          <ArrowLeftIcon size={16} />
        </button>
        <span className={styles.monthYear}>
          {format(currentMonth, 'LLLL yyyy', { locale: ru })}
        </span>
        <button
          className={styles.navButton}
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
        >
          <ArrowRightIcon size={16} />
        </button>
      </div>

      <div className={styles.weekdays}>
        {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((day) => (
          <div key={day} className={styles.weekday}>
            {day}
          </div>
        ))}
      </div>

      <div className={styles.days}>
        {calendarDays.map((day, index) => (
          <button
            key={index}
            className={`${styles.day} ${!isSameMonth(day, currentMonth) ? styles.otherMonth : ''
              } ${value && isSameDay(day, value) ? styles.selected : ''} ${isToday(day) ? styles.today : ''
              } ${isDayDisabled(day) ? styles.disabled : ''}`}
            onClick={() => !isDayDisabled(day) && handleDayClick(day)}
            disabled={isDayDisabled(day)}
          >
            {format(day, 'd')}
          </button>
        ))}
      </div>
    </div>
  )
}