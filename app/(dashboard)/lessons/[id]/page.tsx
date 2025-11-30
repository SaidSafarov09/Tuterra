'use client'

import React, { useEffect, useState, use as usePromise } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { format, isPast } from 'date-fns'
import { ru } from 'date-fns/locale'
import { CheckIcon, XCircleIcon, EditIcon, DeleteIcon, NoteIcon } from '@/components/icons/Icons'
import { Lesson, Student, Subject } from '@/types'
import { useLessonActions } from '@/hooks/useLessonActions'
import { useLessonForm } from '@/hooks/useLessonForm'
import { LessonFormModal } from '@/components/lessons/LessonFormModal'
import styles from './page.module.scss'

export default function LessonDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter()
    const { id } = usePromise(params)

    const [lesson, setLesson] = useState<Lesson | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [deleteConfirm, setDeleteConfirm] = useState(false)
    const [cancelConfirm, setCancelConfirm] = useState(false)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)

    const [students, setStudents] = useState<Student[]>([])
    const [subjects, setSubjects] = useState<Subject[]>([])
    const [studentStats, setStudentStats] = useState<any>(null)

    const { togglePaid, toggleCancel, deleteLesson, isLoading: isActionLoading } = useLessonActions(fetchLesson)

    const fetchStudents = async () => {
        try {
            const res = await fetch('/api/students')
            if (res.ok) setStudents(await res.json())
        } catch (e) {
            console.error(e)
        }
    }

    const fetchSubjects = async () => {
        try {
            const res = await fetch('/api/subjects')
            if (res.ok) setSubjects(await res.json())
        } catch (e) {
            console.error(e)
        }
    }

    const {
        formData,
        setFormData,
        isSubmitting,
        error,
        handleChange,
        handleStudentChange,
        handleCreateStudent,
        handleCreateSubject,
        handleSubmit,
        loadLesson
    } = useLessonForm(
        () => {
            setIsEditModalOpen(false)
            fetchLesson()
        },
        fetchStudents,
        fetchSubjects
    )

    useEffect(() => {
        if (!id) return
        fetchLesson()
        fetchStudents()
        fetchSubjects()
    }, [id])

    useEffect(() => {
        if (lesson) {
            fetchStudentStats(lesson.student.id)
        }
    }, [lesson])

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

    async function fetchStudentStats(studentId: string) {
        try {
            const response = await fetch(`/api/students/${studentId}`)
            if (response.ok) {
                const data = await response.json()
                setStudentStats(data)
            }
        } catch (error) {
            console.error('Failed to fetch student stats', error)
        }
    }

    const handleEditClick = () => {
        if (lesson) {
            loadLesson(lesson)
            setIsEditModalOpen(true)
        }
    }

    const handleEditSubmit = async () => {
        // We need to override handleSubmit to use PUT /api/lessons/[id] instead of POST /api/lessons
        // But useLessonForm is designed for POST. 
        // We can manually call the update API here using formData

        try {
            const response = await fetch(`/api/lessons/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            })

            if (response.ok) {
                toast.success('Занятие обновлено')
                setIsEditModalOpen(false)
                fetchLesson()
            } else {
                const data = await response.json()
                toast.error(data.error || 'Ошибка при обновлении')
            }
        } catch (error) {
            toast.error('Ошибка при обновлении')
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
                            {isLessonPast
                                ? `Занятие было ${format(lessonDate, 'd MMMM yyyy', { locale: ru })} в ${format(lessonDate, 'HH:mm')}`
                                : `Занятие запланировано на ${format(lessonDate, 'd MMMM yyyy', { locale: ru })} в ${format(lessonDate, 'HH:mm')}`
                            }
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

                {lesson.topic && (
                    <div className={styles.topicSection}>
                        <strong>Тема урока:</strong>
                        <p>{lesson.topic}</p>
                    </div>
                )}

                {lesson.notes && (
                    <div className={styles.notesSection}>
                        <strong>Заметки:</strong>
                        <p>{lesson.notes}</p>
                    </div>
                )}

                {studentStats && (
                    <div className={styles.statsSection}>
                        <div className={styles.statItem}>
                            <span className={styles.statLabel}>Всего занятий</span>
                            <span className={styles.statValue}>{studentStats._count?.lessons || 0}</span>
                        </div>
                        {/* Add more stats if available */}
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
                        onClick={handleEditClick}
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

            <LessonFormModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                isEdit={true}
                formData={formData}
                setFormData={setFormData}
                students={students}
                subjects={subjects}
                isSubmitting={isSubmitting}
                error={error}
                onSubmit={handleEditSubmit}
                onStudentChange={handleStudentChange}
                onCreateStudent={handleCreateStudent}
                onCreateSubject={handleCreateSubject}
                handleChange={handleChange}
            />

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