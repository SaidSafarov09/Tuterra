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
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useModalStore } from '@/store/useModalStore'
import { SubjectsIcon, PlusIcon, UsersGroupIcon, ClockIcon, EditIcon, DeleteIcon, BookIcon } from '@/components/icons/Icons'
import { ColorPicker } from '@/components/ui/ColorPicker'
import { Subject, Student } from '@/types'
import styles from './page.module.scss'

const COLORS = [
    '#4A6CF7', '#FF6B6B', '#4ECDC4', '#FFD93D', '#A8E6CF', '#FF8B94',
    '#7B68EE', '#FF69B4', '#00CED1', '#FFA500', '#9370DB', '#20B2AA',
]

export default function SubjectsPage() {
    const router = useRouter()
    const [subjects, setSubjects] = useState<Subject[]>([])
    const [allStudents, setAllStudents] = useState<Student[]>([])
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
    const [addStudentMode, setAddStudentMode] = useState<'create' | 'link'>('link')
    const [selectedStudentId, setSelectedStudentId] = useState('')
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

    // Edit Subject Modal State
    const [isEditSubjectModalOpen, setIsEditSubjectModalOpen] = useState(false)
    const [editSubjectData, setEditSubjectData] = useState({
        id: '',
        name: '',
        color: '#4A6CF7',
    })

    const { isOpen, openModal, closeModal } = useModalStore()
    const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; subject: Subject | null }>({
        isOpen: false,
        subject: null,
    })

    useEffect(() => {
        fetchSubjects()
        fetchAllStudents()
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

    const fetchAllStudents = async () => {
        try {
            const response = await fetch('/api/students')
            if (response.ok) {
                const data = await response.json()
                setAllStudents(data)
            }
        } catch (error) {
            console.error('Failed to fetch students:', error)
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
        setAddStudentMode('link')
        setSelectedStudentId('')
        setStudentFormData({ name: '', contact: '', note: '' })
        setIsAddStudentModalOpen(true)
    }

    const handleCloseAddStudentModal = () => {
        setIsAddStudentModalOpen(false)
        setAddStudentMode('link')
        setSelectedStudentId('')
        setStudentFormData({ name: '', contact: '', note: '' })
    }

    const handleStudentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setStudentFormData((prev) => ({ ...prev, [name]: value }))
    }

    const handleSubmitStudent = async () => {
        if (!selectedSubject) return

        if (addStudentMode === 'create') {
            if (!studentFormData.name.trim()) {
                toast.error('Введите имя ученика')
                return
            }

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
                    await fetchSubjects()
                    await fetchAllStudents()
                    handleCloseAddStudentModal()
                    toast.success('Ученик успешно создан и добавлен')
                } else {
                    toast.error('Не удалось создать ученика')
                }
            } catch (error) {
                toast.error('Произошла ошибка')
            } finally {
                setIsSubmitting(false)
            }
        } else {
            // Link existing student
            if (!selectedStudentId) {
                toast.error('Выберите ученика')
                return
            }

            setIsSubmitting(true)
            try {
                const response = await fetch(`/api/subjects/${selectedSubject.id}/students/link`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ studentId: selectedStudentId }),
                })

                if (response.ok) {
                    await fetchSubjectStudents(selectedSubject.id)
                    await fetchSubjects()
                    handleCloseAddStudentModal()
                    toast.success('Ученик успешно добавлен к предмету')
                } else {
                    toast.error('Не удалось добавить ученика')
                }
            } catch (error) {
                toast.error('Произошла ошибка')
            } finally {
                setIsSubmitting(false)
            }
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

        // Check if lesson date is in the past
        if (lessonFormData.date < new Date()) {
            toast.error('Нельзя создавать занятия в прошедшем времени')
            return
        }

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

    // Edit Subject Handlers
    const handleOpenEditSubjectModal = (subject: Subject) => {
        setEditSubjectData({
            id: subject.id,
            name: subject.name,
            color: subject.color,
        })
        setIsEditSubjectModalOpen(true)
    }

    const handleCloseEditSubjectModal = () => {
        setIsEditSubjectModalOpen(false)
        setEditSubjectData({ id: '', name: '', color: '#4A6CF7' })
    }

    const handleEditSubjectChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setEditSubjectData((prev) => ({ ...prev, [name]: value }))
    }

    const handleSubmitEditSubject = async () => {
        if (!editSubjectData.name.trim()) {
            toast.error('Введите название предмета')
            return
        }

        setIsSubmitting(true)
        try {
            const response = await fetch(`/api/subjects/${editSubjectData.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: editSubjectData.name,
                    color: editSubjectData.color,
                }),
            })

            if (response.ok) {
                await fetchSubjects()
                if (selectedSubject?.id === editSubjectData.id) {
                    setSelectedSubject(prev => prev ? { ...prev, name: editSubjectData.name, color: editSubjectData.color } : null)
                }
                handleCloseEditSubjectModal()
                toast.success('Предмет обновлён')
            } else {
                toast.error('Не удалось обновить предмет')
            }
        } catch (error) {
            toast.error('Произошла ошибка')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDeleteSubject = (subject: Subject) => {
        setDeleteConfirm({ isOpen: true, subject })
    }

    const confirmDeleteSubject = async () => {
        if (!deleteConfirm.subject) return

        try {
            const response = await fetch(`/api/subjects/${deleteConfirm.subject.id}`, {
                method: 'DELETE',
            })

            if (response.ok) {
                const data = await response.json()
                await fetchSubjects()

                if (data.deletedLessonsCount > 0) {
                    toast.success(
                        `Предмет успешно удалён. Также удалено занятий: ${data.deletedLessonsCount}`,
                        { duration: 4000 }
                    )
                } else {
                    toast.success('Предмет успешно удалён')
                }
            } else {
                toast.error('Не удалось удалить предмет')
            }
        } catch (error) {
            toast.error('Произошла ошибка при удалении')
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
                                className={styles.colorAccent}
                                style={{ backgroundColor: subject.color }}
                            />

                            <div className={styles.cardContent}>
                                <div className={styles.cardTop}>
                                    <div className={styles.subjectInfo}>
                                        <div
                                            className={styles.subjectIconSmall}
                                            style={{
                                                backgroundColor: subject.color + '20',
                                                color: subject.color
                                            }}
                                        >
                                            {subject.name[0].toUpperCase()}
                                        </div>
                                        <h3 className={styles.subjectName}>{subject.name}</h3>
                                    </div>

                                    <div className={styles.actions}>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                handleOpenEditSubjectModal(subject)
                                            }}
                                            className={styles.actionButton}
                                            title="Редактировать"
                                        >
                                            <EditIcon size={16} />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                handleDeleteSubject(subject)
                                            }}
                                            className={`${styles.actionButton} ${styles.deleteButton}`}
                                            title="Удалить"
                                        >
                                            <DeleteIcon size={16} />
                                        </button>
                                    </div>
                                </div>

                                <div className={styles.statsRow}>
                                    <div className={styles.stat}>
                                        <UsersGroupIcon size={16} />
                                        <span className={styles.statValue}>{subject._count?.students || 0}</span>
                                        <span className={styles.statLabel}>учеников</span>
                                    </div>
                                    <div className={styles.statDivider}>•</div>
                                    <div className={styles.stat}>
                                        <BookIcon size={16} />
                                        <span className={styles.statValue}>{subject._count?.lessons || 0}</span>
                                        <span className={styles.statLabel}>занятий</span>
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
                        <ColorPicker
                            value={formData.color}
                            onChange={(color) => setFormData((prev) => ({ ...prev, color }))}
                        />
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
                                        {student.lessons && student.lessons.length > 0 ? (
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
                size="large"
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
                    {/* Mode selector */}
                    <div style={{ marginBottom: '16px' }}>
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                            <button
                                type="button"
                                onClick={() => setAddStudentMode('link')}
                                style={{
                                    flex: 1,
                                    padding: '8px 16px',
                                    borderRadius: '8px',
                                    border: '1px solid var(--border)',
                                    background: addStudentMode === 'link' ? 'var(--primary)' : 'transparent',
                                    color: addStudentMode === 'link' ? 'white' : 'var(--text-primary)',
                                    cursor: 'pointer',
                                    fontWeight: 500,
                                }}
                            >
                                Добавить существующего
                            </button>
                            <button
                                type="button"
                                onClick={() => setAddStudentMode('create')}
                                style={{
                                    flex: 1,
                                    padding: '8px 16px',
                                    borderRadius: '8px',
                                    border: '1px solid var(--border)',
                                    background: addStudentMode === 'create' ? 'var(--primary)' : 'transparent',
                                    color: addStudentMode === 'create' ? 'white' : 'var(--text-primary)',
                                    cursor: 'pointer',
                                    fontWeight: 500,
                                }}
                            >
                                Создать нового
                            </button>
                        </div>
                    </div>

                    {addStudentMode === 'link' ? (
                        <Dropdown
                            label="Выберите ученика"
                            placeholder="Выберите ученика"
                            value={selectedStudentId}
                            onChange={(value) => setSelectedStudentId(value)}
                            options={allStudents
                                .filter(s => !s.subjects.some(subj => subj.id === selectedSubject?.id))
                                .map((student) => ({
                                    value: student.id,
                                    label: student.name,
                                }))}
                            searchable
                            required
                            disabled={isSubmitting}
                        />
                    ) : (
                        <>
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
                        </>
                    )}
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

            {/* Edit Subject Modal */}
            <Modal
                isOpen={isEditSubjectModalOpen}
                onClose={handleCloseEditSubjectModal}
                title="Редактировать предмет"
                footer={
                    <ModalFooter
                        onCancel={handleCloseEditSubjectModal}
                        onSubmit={handleSubmitEditSubject}
                        isLoading={isSubmitting}
                        submitText="Сохранить"
                    />
                }
            >
                <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
                    <Input
                        label="Название предмета"
                        name="name"
                        value={editSubjectData.name}
                        onChange={handleEditSubjectChange}
                        required
                        placeholder="Математика, Английский язык"
                        disabled={isSubmitting}
                    />

                    <div>
                        <label style={{ fontSize: '14px', fontWeight: 500, marginBottom: '8px', display: 'block' }}>
                            Цвет
                        </label>
                        <ColorPicker
                            value={editSubjectData.color}
                            onChange={(color) => setEditSubjectData((prev) => ({ ...prev, color }))}
                        />
                    </div>
                </form>
            </Modal>

            <ConfirmDialog
                isOpen={deleteConfirm.isOpen}
                onClose={() => setDeleteConfirm({ isOpen: false, subject: null })}
                onConfirm={confirmDeleteSubject}
                title="Удалить предмет?"
                message={`Вы уверены, что хотите удалить предмет "${deleteConfirm.subject?.name}"? Это действие нельзя отменить. Все связанные занятия также будут удалены.`}
                confirmText="Удалить"
                cancelText="Отмена"
                variant="danger"
            />
        </div>
    )
}
