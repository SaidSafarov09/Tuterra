'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { BookIcon } from '@/components/icons/Icons'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Dropdown, DropdownOption } from '@/components/ui/Dropdown'
import { DateTimePicker } from '@/components/ui/DateTimePicker'
import { Modal, ModalFooter } from '@/components/ui/Modal'
import { useModalStore } from '@/store/useModalStore'
import { formatSmartDate } from '@/lib/dateUtils'
import { EditIcon, DeleteIcon, CheckIcon, XCircleIcon } from '@/components/icons/Icons'
import styles from './page.module.scss'
import { isPast } from 'date-fns'

interface Lesson {
    id: string
    date: string
    price: number
    isPaid: boolean
    isCanceled: boolean
    student: {
        id: string
        name: string
    }
    subject?: {
        id: string
        name: string
        color: string
    }
}

interface Student {
    id: string
    name: string
    subjects: {
        id: string
        name: string
        color: string
    }[]
}

interface Subject {
    id: string
    name: string
    color: string
}

const TABS = [
    { id: 'upcoming', label: 'Предстоящие' },
    { id: 'past', label: 'Прошедшие' },
    { id: 'unpaid', label: 'Неоплаченные' },
    { id: 'canceled', label: 'Отмененные' },
]

export default function LessonsPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [lessons, setLessons] = useState<Lesson[]>([])
    const [students, setStudents] = useState<Student[]>([])
    const [subjects, setSubjects] = useState<Subject[]>([])
    const [filter, setFilter] = useState(searchParams?.get('filter') || 'upcoming')
    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [editingLesson, setEditingLesson] = useState<Lesson | null>(null)
    const [formData, setFormData] = useState({
        studentId: '',
        subjectId: '',
        date: new Date(),
        price: '',
        isPaid: false,
    })
    const [error, setError] = useState('')

    const { isOpen, openModal, closeModal } = useModalStore()

    useEffect(() => {
        fetchStudents()
        fetchSubjects()
        fetchLessons()
    }, [filter])

    const fetchLessons = async () => {
        try {
            const response = await fetch(`/api/lessons?filter=${filter}`)
            if (response.ok) {
                const data = await response.json()
                setLessons(data)
            } else {
                toast.error('Не удалось загрузить занятия')
            }
        } catch (error) {
            toast.error('Произошла ошибка при загрузке занятий')
        } finally {
            setIsLoading(false)
        }
    }

    const fetchStudents = async () => {
        try {
            const response = await fetch('/api/students')
            if (response.ok) {
                const data = await response.json()
                setStudents(data)
            } else {
                toast.error('Не удалось загрузить учеников')
            }
        } catch (error) {
            toast.error('Произошла ошибка при загрузке учеников')
        }
    }

    const fetchSubjects = async () => {
        try {
            const response = await fetch('/api/subjects')
            if (response.ok) {
                const data = await response.json()
                setSubjects(data)
            } else {
                toast.error('Не удалось загрузить предметы')
            }
        } catch (error) {
            toast.error('Произошла ошибка при загрузке предметов')
        }
    }

    const handleOpenModal = () => {
        setEditingLesson(null)
        setFormData({ studentId: '', subjectId: '', date: new Date(), price: '', isPaid: false })
        setError('')
        openModal('create')
    }

    const handleCloseModal = () => {
        closeModal()
        setEditingLesson(null)
        setFormData({ studentId: '', subjectId: '', date: new Date(), price: '', isPaid: false })
        setError('')
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target
        const checked = (e.target as HTMLInputElement).checked
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }))
    }

    const handleStudentChange = (studentId: string) => {
        const student = students.find(s => s.id === studentId)
        // If student has only one subject, pre-select it
        const preSelectedSubject = student?.subjects.length === 1 ? student.subjects[0].id : ''
        setFormData(prev => ({
            ...prev,
            studentId,
            subjectId: preSelectedSubject || prev.subjectId
        }))
    }

    const handleCreateStudent = async (name: string) => {
        try {
            const response = await fetch('/api/students', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name }),
            })

            if (!response.ok) {
                toast.error('Не удалось создать ученика')
                return
            }

            const newStudent = await response.json()
            await fetchStudents()
            setFormData(prev => ({ ...prev, studentId: newStudent.id }))
            toast.success(`Ученик "${name}" создан`)
        } catch (error) {
            toast.error('Ошибка при создании ученика')
        }
    }

    const handleCreateSubject = async (name: string) => {
        try {
            const colors = ['#4A6CF7', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316']
            const randomColor = colors[Math.floor(Math.random() * colors.length)]

            const response = await fetch('/api/subjects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, color: randomColor }),
            })

            if (!response.ok) {
                toast.error('Не удалось создать предмет')
                return
            }

            const newSubject = await response.json()
            await fetchSubjects()
            setFormData(prev => ({ ...prev, subjectId: newSubject.id }))

            // If student is selected, auto-link the subject to the student
            if (formData.studentId) {
                try {
                    await fetch(`/api/subjects/${newSubject.id}/students/link`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ studentId: formData.studentId }),
                    })
                    await fetchStudents() // Refresh to show new subject link
                } catch (error) {
                    console.error('Failed to link subject to student:', error)
                }
            }

            toast.success(`Предмет "${name}" создан`)
        } catch (error) {
            toast.error('Ошибка при создании предмета')
        }
    }

    const handleEditLesson = (lesson: Lesson) => {
        setEditingLesson(lesson)
        setFormData({
            studentId: lesson.student.id,
            subjectId: lesson.subject?.id || '',
            date: new Date(lesson.date),
            price: lesson.price.toString(),
            isPaid: lesson.isPaid,
        })
        setError('')
        openModal('create') // We reuse the create modal
    }

    const handleDeleteLesson = async (lessonId: string) => {
        if (!confirm('Вы уверены, что хотите удалить это занятие?')) return

        try {
            const response = await fetch(`/api/lessons/${lessonId}`, {
                method: 'DELETE',
            })

            if (response.ok) {
                toast.success('Занятие удалено')
                fetchLessons()
            } else {
                toast.error('Не удалось удалить занятие')
            }
        } catch (error) {
            toast.error('Ошибка при удалении занятия')
        }
    }

    const handleToggleCancel = async (lesson: Lesson) => {
        try {
            const response = await fetch(`/api/lessons/${lesson.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isCanceled: !lesson.isCanceled }),
            })

            if (response.ok) {
                const updatedLesson = await response.json()
                toast.success(updatedLesson.isCanceled ? 'Занятие отменено' : 'Занятие восстановлено')
                fetchLessons()
            } else {
                toast.error('Не удалось обновить статус')
            }
        } catch (error) {
            toast.error('Ошибка при обновлении статуса')
        }
    }

    const handleTogglePaid = async (lesson: Lesson) => {
        try {
            const response = await fetch(`/api/lessons/${lesson.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isPaid: !lesson.isPaid }),
            })

            if (response.ok) {
                toast.success(lesson.isPaid ? 'Помечено как неоплаченное' : 'Помечено как оплаченное')
                fetchLessons()
            } else {
                toast.error('Не удалось обновить статус')
            }
        } catch (error) {
            toast.error('Ошибка при обновлении статуса')
        }
    }

    const handleSubmit = async () => {
        if (!formData.studentId || !formData.price) {
            toast.error('Заполните все обязательные поля')
            return
        }

        // Check if lesson date is in the past
        if (formData.date < new Date()) {
            toast.error('Нельзя создавать занятия в прошедшем времени')
            return
        }

        setIsSubmitting(true)
        setError('')

        try {
            const url = editingLesson ? `/api/lessons/${editingLesson.id}` : '/api/lessons'
            const method = editingLesson ? 'PUT' : 'POST'

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    studentId: formData.studentId,
                    subjectId: formData.subjectId || undefined,
                    date: formData.date.toISOString(),
                    price: parseInt(formData.price),
                    isPaid: formData.isPaid,
                }),
            })

            if (response.ok) {
                await fetchLessons()
                handleCloseModal()
                toast.success(editingLesson ? 'Занятие обновлено' : 'Занятие успешно добавлено')
            } else {
                const data = await response.json()
                setError(data.error || 'Произошла ошибка')
            }
        } catch (error) {
            toast.error('Произошла ошибка при создании занятия')
            setError('Произошла ошибка при создании занятия')
        } finally {
            setIsSubmitting(false)
        }
    }

    if (isLoading) {
        return <div className={styles.loading}>Загрузка...</div>
    }

    return (
        <div>
            <div className={styles.header}>
                <div className={styles.headerText}>
                    <h1 className={styles.title}>Занятия</h1>
                    <p className={styles.subtitle}>Управляйте расписанием занятий</p>
                </div>
                <Button onClick={handleOpenModal}>+ Добавить занятие</Button>
            </div>

            <div className={styles.tabs}>
                {TABS.map((tab) => (
                    <button
                        key={tab.id}
                        className={`${styles.tab} ${filter === tab.id ? styles.active : ''}`}
                        onClick={() => setFilter(tab.id)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {lessons.length === 0 ? (
                <div className={styles.emptyState}>
                    <div className={styles.emptyStateIcon}><BookIcon size={64} color="#9CA3AF" /></div>
                    <h2 className={styles.emptyStateTitle}>Нет занятий</h2>
                    <p className={styles.emptyStateText}>
                        Добавьте первое занятие, чтобы начать работу
                    </p>
                    <Button onClick={handleOpenModal}>Добавить занятие</Button>
                </div>
            ) : (
                <div className={styles.lessonsList}>
                    {lessons.map((lesson) => (
                        <div
                            key={lesson?.id}
                            className={`${styles.lessonCard} ${lesson.isCanceled ? styles.lessonCanceled : ''}`}
                        >
                            <div className={styles.lessonHeader}>
                                <div>
                                    <div className={styles.studentNameRow}>
                                        <h3 className={styles.studentName}>{lesson.student.name}</h3>
                                        {lesson.isCanceled && (
                                            <span className={styles.canceledBadge}>Отменено</span>
                                        )}
                                        {lesson.subject && (
                                            <span
                                                className={styles.subjectBadge}
                                                style={{
                                                    color: lesson.subject.color,
                                                    backgroundColor: `${lesson.subject.color}20`
                                                }}
                                            >
                                                {lesson.subject.name}
                                            </span>
                                        )}
                                    </div>
                                    <p className={styles.lessonDate}>
                                        {formatSmartDate(lesson.date)}
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

                            <div className={styles.lessonActions}>
                                <button
                                    className={`${styles.actionButton} ${styles.paidButton} ${lesson.isPaid ? styles.isPaid : ''}`}
                                    onClick={() => handleTogglePaid(lesson)}
                                    disabled={lesson.isCanceled}
                                >
                                    <CheckIcon size={16} />
                                    {lesson.isPaid ? 'Оплачено' : 'Оплатить'}
                                </button>

                                {!isPast(new Date(lesson.date)) && (
                                    <button
                                        className={`${styles.actionButton} ${lesson.isCanceled ? styles.restoreButton : styles.cancelButton}`}
                                        onClick={() => handleToggleCancel(lesson)}
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
                                    onClick={() => handleEditLesson(lesson)}
                                >
                                    <EditIcon size={16} />
                                    Изменить
                                </button>
                                <button
                                    className={`${styles.actionButton} ${styles.deleteButton}`}
                                    onClick={() => handleDeleteLesson(lesson.id)}
                                >
                                    <DeleteIcon size={16} />
                                    Удалить
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Modal
                isOpen={isOpen}
                onClose={handleCloseModal}
                title={editingLesson ? "Редактировать занятие" : "Добавить занятие"}
                footer={
                    <ModalFooter
                        onCancel={handleCloseModal}
                        onSubmit={handleSubmit}
                        isLoading={isSubmitting}
                        submitText={editingLesson ? "Сохранить" : "Добавить"}
                    />
                }
            >
                <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
                    {error && <div style={{ color: 'var(--error)' }}>{error}</div>}

                    <Dropdown
                        label="Ученик"
                        placeholder="Выберите или создайте ученика"
                        value={formData.studentId}
                        onChange={handleStudentChange}
                        options={students.map((student) => ({
                            value: student?.id,
                            label: student.name,
                        }))}
                        searchable
                        creatable
                        onCreate={handleCreateStudent}
                        menuPosition="relative"
                        required
                        disabled={isSubmitting}
                    />

                    <Dropdown
                        label="Предмет"
                        placeholder="Выберите или создайте предмет"
                        value={formData.subjectId}
                        onChange={(value) => setFormData((prev) => ({ ...prev, subjectId: value }))}
                        options={subjects.map((subject) => ({
                            value: subject.id,
                            label: subject.name,
                        }))}
                        searchable
                        creatable
                        onCreate={handleCreateSubject}
                        menuPosition="relative"
                        disabled={isSubmitting}
                    />

                    <DateTimePicker
                        label="Дата и время"
                        value={formData.date}
                        onChange={(date) => setFormData((prev) => ({ ...prev, date }))}
                        showTime
                        required
                        disabled={isSubmitting}
                    />

                    <Input
                        label="Цена"
                        name="price"
                        type="number"
                        value={formData.price}
                        onChange={handleChange}
                        required
                        placeholder="1000"
                        disabled={isSubmitting}
                    />

                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                            type="checkbox"
                            name="isPaid"
                            checked={formData.isPaid}
                            onChange={handleChange}
                            disabled={isSubmitting}
                        />
                        Оплачено
                    </label>
                </form>
            </Modal>
        </div>
    )
}
