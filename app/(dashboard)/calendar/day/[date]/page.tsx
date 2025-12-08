'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { format, parseISO } from 'date-fns'
import { ru } from 'date-fns/locale'
import { Button } from '@/components/ui/Button'
import { ArrowLeft } from 'lucide-react'
import { CalendarDayDetails } from '@/components/calendar/CalendarDayDetails'
import { useLessonActions } from '@/hooks/useLessonActions'
import { calculateDayData } from '@/lib/lessonUtils'
import { lessonsApi } from '@/services/api'
import { Lesson } from '@/types'
import styles from './page.module.scss'

export default function CalendarDayPage() {
    const router = useRouter()
    const params = useParams()
    const dateStr = params.date as string

    const date = parseISO(dateStr)

    const [lessons, setLessons] = useState<Lesson[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const fetchLessons = async () => {
        try {
            const data = await lessonsApi.getAll()
            setLessons(data)
        } catch (error) {
            console.error('Failed to fetch lessons:', error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchLessons()
    }, [])

    const {
        togglePaid,
        toggleCancel,
    } = useLessonActions(fetchLessons)

    const dayData = calculateDayData(lessons, date)

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <Button variant="ghost" onClick={() => router.back()} className={styles.backButton}>
                    <ArrowLeft size={20} />
                    Назад
                </Button>
                <h1 className={styles.title}>{format(date, 'd MMMM yyyy', { locale: ru })}</h1>
            </div>

            <CalendarDayDetails
                date={date}
                dayData={dayData}
                isLoading={isLoading}
                onAddLesson={() => router.push(`/lessons/new?date=${dateStr}`)}
                onTogglePaid={togglePaid}
                onToggleCancel={toggleCancel}
                onReschedule={(lessonId) => router.push(`/lessons/${lessonId}/reschedule`)}
            />
        </div>
    )
}
