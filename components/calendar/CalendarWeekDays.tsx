import React from 'react'
import { WEEK_DAYS } from '@/constants'
import styles from '../../app/(dashboard)/calendar/page.module.scss'

export function CalendarWeekDays() {
    return (
        <div className={styles.calendarWeekDays}>
            {WEEK_DAYS.map((day) => (
                <div key={day} className={styles.weekDay}>
                    {day}
                </div>
            ))}
        </div>
    )
}
