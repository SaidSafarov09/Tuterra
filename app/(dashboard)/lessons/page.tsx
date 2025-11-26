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
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import styles from './page.module.scss'

interface Lesson {
    id: string
    date: string
    price: number
    isPaid: boolean
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

export default function LessonsPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [lessons, setLessons] = useState<Lesson[]>([])
    const [students, setStudents] = useState<Student[]>([])
    const [subjects, setSubjects] = useState<Subject[]>([])
    const [filter, setFilter] = useState(searchParams?.get('filter') || 'upcoming')
    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
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
        setFormData({ studentId: '', subjectId: '', date: new Date(), price: '', isPaid: false })
        setError('')
        openModal('create')
    }

    const handleCloseModal = () => {
        closeModal()
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

    const handleSubmit = async () => {
        if (!formData.studentId || !formData.price) {
            toast.error('Заполните все обязательные поля')
            return
        }

        setIsSubmitting(true)
        setError('')

        try {
            const response = await fetch('/api/lessons', {
                method: 'POST',
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
                toast.success('Занятие успешно добавлено')
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

            <div className={styles.filters}>
                <Button
                    variant={filter === 'upcoming' ? 'primary' : 'ghost'}
                    onClick={() => setFilter('upcoming')}
                >
                    Предстоящие
                </Button>
                <Button
                    variant={filter === 'past' ? 'primary' : 'ghost'}
                    onClick={() => setFilter('past')}
                >
                    Прошедшие
                </Button>
                <Button
                    variant={filter === 'unpaid' ? 'primary' : 'ghost'}
                    onClick={() => setFilter('unpaid')}
                >
                    Неоплаченные
                </Button>
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
                            className={styles.lessonCard}
                            onClick={() => router.push(`/lessons/${lesson?.id}`)}
                        >
                            <div className={styles.lessonHeader}>
                                <div>
                                    <div className={styles.studentNameRow}>
                                        <h3 className={styles.studentName}>{lesson.student.name}</h3>
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
                                        {format(new Date(lesson.date), 'dd MMMM yyyy, HH:mm', { locale: ru })}
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
                        </div>
                    ))}
                </div>
            )}

            <Modal
                isOpen={isOpen}
                onClose={handleCloseModal}
                title="Добавить занятие"
                footer={
                    <ModalFooter
                        onCancel={handleCloseModal}
                        onSubmit={handleSubmit}
                        isLoading={isSubmitting}
                        submitText="Добавить"
                    />
                }
            >
                <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
                    {error && <div style={{ color: 'var(--error)' }}>{error}</div>}

                    <Dropdown
                        label="Ученик"
                        placeholder="Выберите ученика"
                        value={formData.studentId}
                        onChange={handleStudentChange}
                        options={students.map((student) => ({
                            value: student?.id,
                            label: student.name,
                        }))}
                        searchable
                        required
                        disabled={isSubmitting}
                    />

                    <Dropdown
                        label="Предмет"
                        placeholder="Выберите предмет"
                        value={formData.subjectId}
                        onChange={(value) => setFormData((prev) => ({ ...prev, subjectId: value }))}
                        options={subjects.map((subject) => ({
                            value: subject.id,
                            label: subject.name,
                        }))}
                        searchable
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
