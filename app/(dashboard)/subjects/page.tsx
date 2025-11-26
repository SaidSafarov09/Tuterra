'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Dropdown } from '@/components/ui/Dropdown'
import { DateTimePicker } from '@/components/ui/DateTimePicker'
import { Modal, ModalFooter } from '@/components/ui/Modal'
import { useModalStore } from '@/store/useModalStore'
import { SubjectsIcon, PlusIcon, UsersGroupIcon, ClockIcon } from '@/components/icons/Icons'
import styles from './page.module.scss'

interface Subject {
    id: string
    name: string
    color: string
    _count: {
        students: number
        lessons: number
    }
}

interface Student {
    id: string
    name: string
    lessons: {
        id: string
        date: string
        price: number
    }[]
}

const COLORS = [
    '#4A6CF7', '#FF6B6B', '#4ECDC4', '#FFD93D', '#A8E6CF', '#FF8B94',
    '#7B68EE', '#FF69B4', '#00CED1', '#FFA500', '#9370DB', '#20B2AA',
]

export default function SubjectsPage() {
    const router = useRouter()
    const [subjects, setSubjects] = useState<Subject[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        color: '#4A6CF7',
    })
    const [error, setError] = useState('')

    // Subject Details Modal State
    const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null)
    const [subjectStudents, setSubjectStudents] = useState<Student[]>([])
    const [isLoadingStudents, setIsLoadingStudents] = useState(false)
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)

    // Add Student Modal State
    const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false)
    const [studentFormData, setStudentFormData] = useState({
        name: '',
        contact: '',
        note: '',
    })

    // Create Lesson Modal State
    const [isCreateLessonModalOpen, setIsCreateLessonModalOpen] = useState(false)
    const [lessonFormData, setLessonFormData] = useState({
        studentId: '',
        date: new Date(),
        price: '',
        isPaid: false,
    })

    const { isOpen, openModal, closeModal } = useModalStore()

    useEffect(() => {
        fetchSubjects()
    }, [])

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
        } finally {
            setIsLoading(false)
        }
    }

    const fetchSubjectStudents = async (subjectId: string) => {
        setIsLoadingStudents(true)
        try {
            const response = await fetch(`/api/subjects/${subjectId}/students`)
            if (response.ok) {
                const data = await response.json()
                setSubjectStudents(data)
            } else {
                toast.error('Не удалось загрузить учеников')
            }
        } catch (error) {
            toast.error('Произошла ошибка при загрузке учеников')
        } finally {
            setIsLoadingStudents(false)
        }
    }

    const handleSubjectClick = (subject: Subject) => {
        setSelectedSubject(subject)
        setIsDetailsModalOpen(true)
        fetchSubjectStudents(subject.id)
    }

    const handleCloseDetailsModal = () => {
        setIsDetailsModalOpen(false)
        setSelectedSubject(null)
        setSubjectStudents([])
    }

    // Create Subject Modal Handlers
    const handleOpenCreateModal = () => {
        setFormData({ name: '', color: '#4A6CF7' })
        setError('')
        openModal('create')
    }

    const handleCloseCreateModal = () => {
        closeModal()
        setFormData({ name: '', color: '#4A6CF7' })
        setError('')
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData((prev) => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async () => {
        if (!formData.name.trim()) {
            toast.error('Введите название предмета')
            return
        }

        setIsSubmitting(true)
        setError('')

        try {
            const response = await fetch('/api/subjects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            })

            if (response.ok) {
                await fetchSubjects()
                handleCloseCreateModal()
                toast.success('Предмет успешно добавлен')
            } else {
                const data = await response.json()
                setError(data.error || 'Произошла ошибка')
            }
        } catch (error) {
            toast.error('Произошла ошибка при создании предмета')
            setError('Произошла ошибка при создании предмета')
        } finally {
            setIsSubmitting(false)
        }
    }

    // Add Student Handlers
    const handleOpenAddStudentModal = () => {
        setStudentFormData({ name: '', contact: '', note: '' })
        setIsAddStudentModalOpen(true)
    }

    const handleCloseAddStudentModal = () => {
        setIsAddStudentModalOpen(false)
        setStudentFormData({ name: '', contact: '', note: '' })
    }

    const handleStudentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setStudentFormData((prev) => ({ ...prev, [name]: value }))
    }

    const handleSubmitStudent = async () => {
        if (!studentFormData.name.trim()) {
            toast.error('Введите имя ученика')
            return
        }
        if (!selectedSubject) return

        setIsSubmitting(true)
        try {
            const response = await fetch('/api/students', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...studentFormData,
                    subjectId: selectedSubject.id,
                }),
            })

            if (response.ok) {
                await fetchSubjectStudents(selectedSubject.id)
                await fetchSubjects() // Update counts
                handleCloseAddStudentModal()
                toast.success('Ученик успешно добавлен')
            } else {
                toast.error('Не удалось добавить ученика')
            }
        } catch (error) {
            toast.error('Произошла ошибка')
        } finally {
            setIsSubmitting(false)
        }
    }

    // Create Lesson Handlers
    const handleOpenCreateLessonModal = () => {
        setLessonFormData({ studentId: '', date: new Date(), price: '', isPaid: false })
        setIsCreateLessonModalOpen(true)
    }

    const handleCloseCreateLessonModal = () => {
        setIsCreateLessonModalOpen(false)
        setLessonFormData({ studentId: '', date: new Date(), price: '', isPaid: false })
    }

    const handleLessonChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target
        const checked = (e.target as HTMLInputElement).checked
        setLessonFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }))
    }

    const handleSubmitLesson = async () => {
        if (!lessonFormData.studentId || !lessonFormData.price) {
            toast.error('Заполните обязательные поля')
            return
        }
        if (!selectedSubject) return

        setIsSubmitting(true)
        try {
            const response = await fetch('/api/lessons', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    studentId: lessonFormData.studentId,
                    subjectId: selectedSubject.id,
                    date: lessonFormData.date.toISOString(),
                    price: parseInt(lessonFormData.price),
                    isPaid: lessonFormData.isPaid,
                }),
            })

            if (response.ok) {
                await fetchSubjectStudents(selectedSubject.id) // Update lessons info
                await fetchSubjects() // Update counts
                handleCloseCreateLessonModal()
                toast.success('Занятие успешно создано')
            } else {
                toast.error('Не удалось создать занятие')
            }
        } catch (error) {
            toast.error('Произошла ошибка')
        } finally {
            setIsSubmitting(false)
        }
    }

    // Helper to generate initials
    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)
    }

    const stringToColor = (str: string): string => {
        let hash = 0
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash)
        }
        const hue = Math.abs(hash % 360)
        return `hsl(${hue}, 65%, 55%)`
    }

    if (isLoading) {
        return <div className={styles.loading}>Загрузка...</div>
    }

    return (
        <div>
            <div className={styles.header}>
                <div className={styles.headerText}>
                    <h1 className={styles.title}>Предметы</h1>
                    <p className={styles.subtitle}>Ваши учебные дисциплины</p>
                </div>
                <Button onClick={handleOpenCreateModal}>
                    <PlusIcon size={20} />
                    Добавить предмет
                </Button>
            </div>

            {subjects.length === 0 ? (
                <div className={styles.emptyState}>
                    <div className={styles.emptyStateIcon}>
                        <SubjectsIcon size={64} color="#9CA3AF" />
                    </div>
                    <h2 className={styles.emptyStateTitle}>Нет предметов</h2>
                    <p className={styles.emptyStateText}>
                        Добавьте первый предмет, чтобы начать работу
                    </p>
                    <Button onClick={handleOpenCreateModal}>Добавить предмет</Button>
                </div>
            ) : (
                <div className={styles.subjectsGrid}>
                    {subjects.map((subject) => (
                        <div
                            key={subject.id}
                            className={styles.subjectCard}
                            onClick={() => handleSubjectClick(subject)}
                        >
                            <div
                                className={styles.cardHeader}
                                style={{ backgroundColor: subject.color }}
                            >
                                <div className={styles.cardIcon}>
                                    {subject.name[0].toUpperCase()}
                                </div>
                            </div>
                            <div className={styles.cardContent}>
                                <h3 className={styles.cardTitle}>{subject.name}</h3>
                                <div className={styles.cardStats}>
                                    <div className={styles.cardStat}>
                                        <UsersGroupIcon size={16} />
                                        <span>{subject._count.students} учеников</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Subject Modal */}
            <Modal
                isOpen={isOpen}
                onClose={handleCloseCreateModal}
                title="Добавить предмет"
                footer={
                    <ModalFooter
                        onCancel={handleCloseCreateModal}
                        onSubmit={handleSubmit}
                        isLoading={isSubmitting}
                        submitText="Добавить"
                    />
                }
            >
                <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
                    {error && <div style={{ color: 'var(--error)' }}>{error}</div>}

                    <Input
                        label="Название предмета"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        placeholder="Математика, Английский язык"
                        disabled={isSubmitting}
                    />

                    <div>
                        <label style={{ fontSize: '14px', fontWeight: 500, marginBottom: '8px', display: 'block' }}>
                            Цвет
                        </label>
                        <div className={styles.colorPicker}>
                            {COLORS.map((color) => (
                                <div
                                    key={color}
                                    className={`${styles.colorOption} ${formData.color === color ? styles.selected : ''
                                        }`}
                                    style={{ background: color }}
                                    onClick={() => setFormData((prev) => ({ ...prev, color }))}
                                />
                            ))}
                        </div>
                    </div>
                </form>
            </Modal>

            {/* Subject Details Modal */}
            <Modal
                isOpen={isDetailsModalOpen}
                onClose={handleCloseDetailsModal}
                title={selectedSubject?.name || 'Предмет'}
                footer={
                    <div className={styles.detailsFooter}>
                        <Button variant="secondary" onClick={handleOpenAddStudentModal}>
                            Добавить ученика
                        </Button>
                        <Button onClick={handleOpenCreateLessonModal}>
                            Создать занятие
                        </Button>
                    </div>
                }
            >
                <div className={styles.detailsContent}>
                    {isLoadingStudents ? (
                        <div className={styles.loading}>Загрузка учеников...</div>
                    ) : subjectStudents.length === 0 ? (
                        <div className={styles.emptyDetails}>
                            <p>В этом предмете пока нет учеников</p>
                        </div>
                    ) : (
                        <div className={styles.studentsList}>
                            {subjectStudents.map((student) => (
                                <div key={student.id} className={styles.studentItem}>
                                    <div className={styles.studentInfo}>
                                        <div
                                            className={styles.studentAvatar}
                                            style={{ backgroundColor: stringToColor(student.name) }}
                                        >
                                            {getInitials(student.name)}
                                        </div>
                                        <span className={styles.studentName}>{student.name}</span>
                                    </div>
                                    <div className={styles.lessonInfo}>
                                        {student.lessons.length > 0 ? (
                                            <div className={styles.nextLesson}>
                                                <ClockIcon size={14} className={styles.clockIcon} />
                                                <span>
                                                    {format(new Date(student.lessons[0].date), 'd MMM, HH:mm', { locale: ru })}
                                                </span>
                                            </div>
                                        ) : (
                                            <span className={styles.noLesson}>Нет занятий</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </Modal>

            {/* Add Student Modal */}
            <Modal
                isOpen={isAddStudentModalOpen}
                onClose={handleCloseAddStudentModal}
                title="Добавить ученика"
                footer={
                    <ModalFooter
                        onCancel={handleCloseAddStudentModal}
                        onSubmit={handleSubmitStudent}
                        isLoading={isSubmitting}
                        submitText="Добавить"
                    />
                }
            >
                <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
                    <Input
                        label="Имя"
                        name="name"
                        value={studentFormData.name}
                        onChange={handleStudentChange}
                        required
                        placeholder="Иван Иванов"
                        disabled={isSubmitting}
                    />
                    <Input
                        label="Контакт"
                        name="contact"
                        value={studentFormData.contact}
                        onChange={handleStudentChange}
                        placeholder="@telegram"
                        disabled={isSubmitting}
                    />
                    <Input
                        label="Заметка"
                        name="note"
                        value={studentFormData.note}
                        onChange={handleStudentChange}
                        placeholder="Дополнительная информация"
                        disabled={isSubmitting}
                    />
                </form>
            </Modal>

            {/* Create Lesson Modal */}
            <Modal
                isOpen={isCreateLessonModalOpen}
                onClose={handleCloseCreateLessonModal}
                title="Создать занятие"
                footer={
                    <ModalFooter
                        onCancel={handleCloseCreateLessonModal}
                        onSubmit={handleSubmitLesson}
                        isLoading={isSubmitting}
                        submitText="Создать"
                    />
                }
            >
                <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
                    <Dropdown
                        label="Ученик"
                        placeholder="Выберите ученика"
                        value={lessonFormData.studentId}
                        onChange={(value) => setLessonFormData((prev) => ({ ...prev, studentId: value }))}
                        options={subjectStudents.map((student) => ({
                            value: student.id,
                            label: student.name,
                        }))}
                        searchable
                        required
                        disabled={isSubmitting}
                    />

                    <DateTimePicker
                        label="Дата и время"
                        value={lessonFormData.date}
                        onChange={(date) => setLessonFormData((prev) => ({ ...prev, date }))}
                        showTime
                        required
                        disabled={isSubmitting}
                    />

                    <Input
                        label="Цена"
                        name="price"
                        type="number"
                        value={lessonFormData.price}
                        onChange={handleLessonChange}
                        required
                        placeholder="1000"
                        disabled={isSubmitting}
                    />

                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                            type="checkbox"
                            name="isPaid"
                            checked={lessonFormData.isPaid}
                            onChange={handleLessonChange}
                            disabled={isSubmitting}
                        />
                        Оплачено
                    </label>
                </form>
            </Modal>
        </div>
    )
}
