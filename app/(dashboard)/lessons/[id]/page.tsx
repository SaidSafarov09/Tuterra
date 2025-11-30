'use client'

import React, { useEffect, useState, use as usePromise } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { format, isPast } from 'date-fns'
import { ru } from 'date-fns/locale'
import { CheckIcon, XCircleIcon, EditIcon, DeleteIcon } from '@/components/icons/Icons'
import { Lesson } from '@/types'
import { useLessonActions } from '@/hooks/useLessonActions'
import styles from './page.module.scss'

export default function LessonDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter()
    const { id } = usePromise(params)

    const [lesson, setLesson] = useState<Lesson | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [deleteConfirm, setDeleteConfirm] = useState(false)
    const [cancelConfirm, setCancelConfirm] = useState(false)

    const { togglePaid, toggleCancel, deleteLesson, isLoading: isActionLoading } = useLessonActions(fetchLesson)

    useEffect(() => {
        if (!id) return
        fetchLesson()
    }, [id])

    async function fetchLesson() {
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
        await togglePaid(lesson)
    }

    const handleToggleCancel = async () => {
        if (!lesson) return
        setCancelConfirm(false)
        await toggleCancel(lesson)
    }

    const handleDelete = async () => {
        setDeleteConfirm(false)
        await deleteLesson(id)
        router.push('/lessons')
    }

    if (isLoading) {
        return <div className={styles.loading}>Загрузка...</div>
    }

    if (!lesson) return null

    const lessonDate = new Date(lesson.date)
    const isLessonPast = isPast(lessonDate)

    return (
        <div>
            <div className={styles.header}>
                <button className={styles.backButton} onClick={() => router.back()}>
                    ← Назад
                </button>
            </div>

            <div className={`${styles.lessonCard} ${lesson.isCanceled ? styles.lessonCanceled : ''}`}>
                <div className={styles.lessonHeader}>
                    <div>
                        <div className={styles.studentNameRow}>
                            <h1 className={styles.studentName}>{lesson.student.name}</h1>
                            {lesson.subject && (
                                <span
                                    className={styles.subjectBadge}
                                    style={{
                                        color: lesson.subject.color,
                                        backgroundColor: lesson.subject.color + '15',
                                        borderColor: lesson.subject.color + '30',
                                    }}
                                >
                                    {lesson.subject.name}
                                </span>
                            )}
                            {lesson.isCanceled && (
                                <span className={styles.canceledBadge}>Отменено</span>
                            )}
                        </div>
                        <p className={styles.lessonDate}>
                            {format(lessonDate, 'dd MMMM yyyy, HH:mm', { locale: ru })}
                        </p>
                    </div>
                    <div className={styles.lessonPriceContainer}>
                        <div className={styles.lessonPrice}>{lesson.price} ₽</div>
                        <span
                            className={`${styles.badge} ${lesson.isPaid ? styles.badgePaid : styles.badgeUnpaid
                                }`}
                        >
                            {lesson.isPaid ? 'Оплачено' : 'Не оплачено'}
                        </span>
                    </div>
                </div>

                {lesson.notes && (
                    <div className={styles.notesSection}>
                        <strong>Заметки:</strong>
                        <p>{lesson.notes}</p>
                    </div>
                )}

                <div className={styles.lessonActions}>
                    <button
                        className={`${styles.actionButton} ${styles.paidButton} ${lesson.isPaid ? styles.isPaid : ''
                            }`}
                        onClick={handleTogglePaid}
                        disabled={isActionLoading || lesson.isCanceled}
                    >
                        <CheckIcon size={16} />
                        {lesson.isPaid ? 'Оплачено' : 'Оплатить'}
                    </button>

                    {!isLessonPast && (
                        <button
                            className={`${styles.actionButton} ${lesson.isCanceled ? styles.restoreButton : styles.cancelButton
                                }`}
                            onClick={() => setCancelConfirm(true)}
                            disabled={isActionLoading}
                        >
                            {lesson.isCanceled ? (
                                <>
                                    <CheckIcon size={16} />
                                    Восстановить
                                </>
                            ) : (
                                <>
                                    <XCircleIcon size={16} />
                                    Отменить
                                </>
                            )}
                        </button>
                    )}

                    <button
                        className={`${styles.actionButton} ${styles.editButton}`}
                        onClick={() => toast.info('Редактирование скоро будет доступно')}
                        disabled={isLessonPast}
                    >
                        <EditIcon size={16} />
                        Изменить
                    </button>

                    <button
                        className={`${styles.actionButton} ${styles.deleteButton}`}
                        onClick={() => setDeleteConfirm(true)}
                        disabled={isActionLoading}
                    >
                        <DeleteIcon size={16} />
                        Удалить
                    </button>
                </div>
            </div>

            <ConfirmDialog
                isOpen={deleteConfirm}
                onClose={() => setDeleteConfirm(false)}
                onConfirm={handleDelete}
                title="Удалить занятие?"
                message="Вы уверены, что хотите удалить это занятие? Это действие нельзя отменить."
                confirmText="Удалить"
                cancelText="Отмена"
                variant="danger"
            />

            <ConfirmDialog
                isOpen={cancelConfirm}
                onClose={() => setCancelConfirm(false)}
                onConfirm={handleToggleCancel}
                title={lesson.isCanceled ? 'Восстановить занятие?' : 'Отменить занятие?'}
                message={
                    lesson.isCanceled
                        ? 'Вы уверены, что хотите восстановить это занятие?'
                        : 'Вы уверены, что хотите отменить это занятие?'
                }
                confirmText={lesson.isCanceled ? 'Восстановить' : 'Отменить'}
                cancelText="Назад"
                variant={lesson.isCanceled ? 'info' : 'danger'}
            />
        </div>
    )
}