'use client'

import React, { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { ArrowLeft } from 'lucide-react'
import { CustomDateTimePicker } from '@/components/ui/CustomDateTimePicker'
import { useFetch } from '@/hooks/useFetch'
import { Lesson } from '@/types'
import { updateLesson } from '@/services/actions/lessonActions'
import { toast } from 'sonner'
import styles from './page.module.scss'

export default function RescheduleLessonPage() {
    const router = useRouter()
    const params = useParams()
    const lessonId = params.id as string

    const { data: lesson, isLoading } = useFetch<Lesson>(`/api/lessons/${lessonId}`)
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
    const [isSubmitting, setIsSubmitting] = useState(false)

    React.useEffect(() => {
        if (lesson) {
            setSelectedDate(new Date(lesson.date))
        }
    }, [lesson])

    const handleConfirm = async () => {
        if (!selectedDate || !lesson) return

        setIsSubmitting(true)
        const success = await updateLesson(lessonId, {
            date: selectedDate,
        })

        if (success) {
            toast.success('Занятие перенесено')
            router.back()
        }
        setIsSubmitting(false)
    }

    if (isLoading) return <div className={styles.container}>Загрузка...</div>
    if (!lesson) return <div className={styles.container}>Занятие не найдено</div>

    return (
        <div className={`${styles.container} page-enter-animation`}>
            <div className={styles.header}>
                <Button variant="ghost" onClick={() => router.back()} className={styles.backButton}>
                    <ArrowLeft size={20} />
                    Назад
                </Button>
                <h1 className={styles.title}>Перенести занятие</h1>
            </div>

            <div className={styles.content}>
                <CustomDateTimePicker
                    value={selectedDate}
                    onChange={setSelectedDate}
                />
            </div>

            <div className={styles.footer}>
                <Button onClick={handleConfirm} fullWidth isLoading={isSubmitting}>
                    Перенести
                </Button>
            </div>
        </div>
    )
}
