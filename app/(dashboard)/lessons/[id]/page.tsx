'use client'

import React, { useEffect, useState, use as usePromise } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import styles from './page.module.scss'

import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

interface Lesson {
    id: string
    date: string
    price: number
    isPaid: boolean
    student: {
        id: string
        name: string
    }
}
export default function LessonDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter()
    const { id } = usePromise(params)

    const [lesson, setLesson] = useState<Lesson | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isUpdating, setIsUpdating] = useState(false)
    const [deleteConfirm, setDeleteConfirm] = useState(false)

    useEffect(() => {
        if (!id) return
        fetchLesson()
    }, [id])

    const fetchLesson = async () => {
        try {
            const response = await fetch(`/api/lessons/${id}`)
            if (!response.ok) {
                toast.error('Занятие не найдено')
                router.push('/lessons')
                return
            }

            const data = await response.json()
            setLesson(data)
        } catch (error) {
            toast.error('Произошла ошибка при загрузке занятия')
            router.push('/lessons')
        } finally {
            setIsLoading(false)
        }
    }

    const handleTogglePaid = async () => {
        if (!lesson) return
        setIsUpdating(true)

        try {
            const response = await fetch(`/api/lessons/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...lesson,
                    isPaid: !lesson.isPaid,
                }),
            })

            if (response.ok) {
                await fetchLesson()
                toast.success(lesson.isPaid ? 'Отмечено как неоплаченное' : 'Отмечено как оплаченное')
            } else {
                toast.error('Произошла ошибка при обновлении')
            }
        } catch (error) {
            toast.error('Произошла ошибка при обновлении')
        } finally {
            setIsUpdating(false)
        }
    }

    const handleDelete = () => {
        setDeleteConfirm(true)
    }

    const confirmDelete = async () => {
        try {
            const response = await fetch(`/api/lessons/${id}`, {
                method: 'DELETE',
            })

            if (response.ok) {
                toast.success('Занятие успешно удалено')
                router.push('/lessons')
            } else {
                toast.error('Произошла ошибка при удалении')
            }
        } catch (error) {
            toast.error('Произошла ошибка при удалении')
        } finally {
            setDeleteConfirm(false)
        }
    }

    if (isLoading) {
        return <div className={styles.loading}>Загрузка...</div>
    }

    if (!lesson) return null

    return (
        <div>
            <div className={styles.header}>
                <Button variant="ghost" onClick={() => router.back()}>
                    ← Назад
                </Button>
            </div>

            <div className={styles.card}>
                <div className={styles.cardHeader}>
                    <div>
                        <h1 className={styles.title}>Занятие с {lesson.student.name}</h1>
                        <p className={styles.date}>
                            {format(new Date(lesson.date), 'dd MMMM yyyy, HH:mm', { locale: ru })}
                        </p>
                    </div>
                    <div className={styles.priceContainer}>
                        <div className={styles.price}>{lesson.price} ₽</div>
                        <span
                            className={`${styles.badge} ${lesson.isPaid ? styles.badgePaid : styles.badgeUnpaid
                                }`}
                        >
                            {lesson.isPaid ? 'Оплачено' : 'Не оплачено'}
                        </span>
                    </div>
                </div>

                <div className={styles.actions}>
                    <Button
                        variant={lesson.isPaid ? 'secondary' : 'primary'}
                        onClick={handleTogglePaid}
                        disabled={isUpdating}
                    >
                        {isUpdating
                            ? 'Обновление...'
                            : lesson.isPaid
                                ? 'Отметить как неоплаченное'
                                : 'Отметить как оплаченное'}
                    </Button>

                    <Button variant="danger" onClick={handleDelete}>
                        Удалить занятие
                    </Button>
                </div>

                <div className={styles.info}>
                    <div className={styles.infoItem}>
                        <span className={styles.infoLabel}>Ученик:</span>
                        <span
                            className={styles.infoValue}
                            style={{ color: 'var(--primary)', cursor: 'pointer' }}
                            onClick={() => router.push(`/students/${lesson.student.id}`)}
                        >
                            {lesson.student.name}
                        </span>
                    </div>
                </div>
            </div>

            <ConfirmDialog
                isOpen={deleteConfirm}
                onClose={() => setDeleteConfirm(false)}
                onConfirm={confirmDelete}
                title="Удалить занятие?"
                message="Вы уверены, что хотите удалить это занятие? Это действие нельзя отменить."
                confirmText="Удалить"
                cancelText="Отмена"
                variant="danger"
            />
        </div>
    )
}