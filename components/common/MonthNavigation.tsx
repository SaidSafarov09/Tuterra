import React from 'react'
import { ChevronLeftIcon, ChevronRightIcon } from '@/components/icons/Icons'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import styles from './MonthNavigation.module.scss'

import {
    Snowflake,
    Wind,
    Sprout,
    Umbrella,
    Flower,
    Sun,
    Palmtree,
    Waves,
    Leaf,
    Ghost,
    Cloud,
    Gift
} from 'lucide-react'

interface MonthNavigationProps {
    currentMonth: Date
    onPreviousMonth: () => void
    onNextMonth: () => void
    className?: string
}

const getMonthIcon = (monthIndex: number) => {
    const icons = [
        { Icon: Snowflake, color: '#60a5fa' }, // Январь
        { Icon: Wind, color: '#94a3b8' },      // Февраль
        { Icon: Sprout, color: '#4ade80' },    // Март
        { Icon: Umbrella, color: '#6366f1' },  // Апрель
        { Icon: Flower, color: '#f472b6' },    // Май
        { Icon: Sun, color: '#fbbf24' },       // Июнь
        { Icon: Palmtree, color: '#10b981' },  // Июль
        { Icon: Waves, color: '#06b6d4' },     // Август
        { Icon: Leaf, color: '#f97316' },      // Сентябрь
        { Icon: Ghost, color: '#a855f7' },     // Октябрь
        { Icon: Cloud, color: '#64748b' },     // Ноябрь
        { Icon: Gift, color: '#ef4444' }       // Декабрь
    ]
    return icons[monthIndex] || icons[0]
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
    const monthIndex = currentMonth.getMonth()
    const { Icon, color } = getMonthIcon(monthIndex)

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
                <span className={styles.monthIcon}>
                    <Icon size={28} color={color} strokeWidth={2.5} />
                </span>
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
