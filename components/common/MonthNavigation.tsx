import React from 'react'
import { ChevronLeftIcon, ChevronRightIcon } from '@/components/icons/Icons'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import styles from '../../app/(dashboard)/calendar/page.module.scss'

interface MonthNavigationProps {
    currentMonth: Date
    onPreviousMonth: () => void
    onNextMonth: () => void
    className?: string
}

/**
 * Reusable month navigation component
 * Used in Calendar, Income, and other pages with month-based navigation
 */
export function MonthNavigation({
    currentMonth,
    onPreviousMonth,
    onNextMonth,
    className = ''
}: MonthNavigationProps) {
    return (
        <div className={`${styles.calendarHeader} ${className}`}>
            <button
                className={styles.navButton}
                onClick={onPreviousMonth}
                aria-label="Предыдущий месяц"
            >
                <ChevronLeftIcon size={20} />
            </button>
            <h2 className={styles.monthTitle}>
                {format(currentMonth, 'LLLL yyyy', { locale: ru })}
            </h2>
            <button
                className={styles.navButton}
                onClick={onNextMonth}
                aria-label="Следующий месяц"
            >
                <ChevronRightIcon size={20} />
            </button>
        </div>
    )
}
