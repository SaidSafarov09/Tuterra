'use client'

import React, { useEffect, useState, use as usePromise } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Dropdown } from '@/components/ui/Dropdown'
import { Modal, ModalFooter } from '@/components/ui/Modal'
import { DateTimePicker } from '@/components/ui/DateTimePicker'
import { EditIcon, PlusIcon, ClockIcon } from '@/components/icons/Icons'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import styles from './page.module.scss'

interface Lesson {
    id: string
    date: string
    price: number
    isPaid: boolean
}

interface Subject {
    id: string
    name: string
    color: string
}

interface Student {
    id: string
    name: string
    contact?: string | null
    note?: string | null
    subjects: Subject[]
    lessons: Lesson[]
    _count: {
        lessons: number
    }
}

export default function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter()
    const { id } = usePromise(params)

    const [student, setStudent] = useState<Student | null>(null)
    const [allSubjects, setAllSubjects] = useState<Subject[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Edit Student Modal State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [editFormData, setEditFormData] = useState({
        name: '',
        contact: '',
        note: '',
    })

    // Add Subject Modal State
    const [isAddSubjectModalOpen, setIsAddSubjectModalOpen] = useState(false)
    const [selectedSubjectId, setSelectedSubjectId] = useState('')

    // Create Lesson Modal State
    // Create Lesson Modal State
    const [isCreateLessonModalOpen, setIsCreateLessonModalOpen] = useState(false)
    const [lessonFormData, setLessonFormData] = useState({
        subjectId: '',
        date: new Date(),
        price: '',
        isPaid: false,
    })

    useEffect(() => {
        if (!id) return
        fetchStudent()
        fetchSubjects()
    }, [id])

    const fetchStudent = async () => {
        try {
            const response = await fetch(`/api/students/${id}`)
            if (response.ok) {
                const data = await response.json()
                setStudent(data)
            } else {
                toast.error('Ученик не найден')
                router.push('/students')
            }
        } catch (error) {
            toast.error('Произошла ошибка при загрузке ученика')
            router.push('/students')
        } finally {
            setIsLoading(false)
        }
    }

    const fetchSubjects = async () => {
        try {
            const response = await fetch('/api/subjects')
            if (response.ok) {
                setAllSubjects(await response.json())
            }
        } catch (error) {
            console.error('Failed to fetch subjects:', error)
        }
    }

    const handleDelete = async () => {
        if (!confirm('Вы уверены, что хотите удалить этого ученика? Все занятия также будут удалены.')) {
            return
        }

        try {
            const response = await fetch(`/api/students/${id}`, {
                method: 'DELETE',
            })

            if (response.ok) {
                toast.success('Ученик успешно удален')
                router.push('/students')
            } else {
                toast.error('Произошла ошибка при удалении')
            }
        } catch (error) {
            toast.error('Произошла ошибка при удалении')
        }
    }

    const handleDeleteSubject = async (subjectId: string) => {
        if (!confirm('Удалить предмет у этого ученика?')) return

        try {
            const response = await fetch(`/api/subjects/${subjectId}/students/link`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ studentId: id }),
            })

            if (response.ok) {
                await fetchStudent()
                await fetchSubjects()
                toast.success('Предмет удалён')
            } else {
                toast.error('Не удалось удалить предмет')
            }
        } catch (error) {
            toast.error('Произошла ошибка')
        }
    }

    // Edit Student Handlers
    const handleOpenEditModal = () => {
        if (!student) return
        setEditFormData({
            name: student.name,
            contact: student.contact || '',
            note: student.note || '',
        })
        setIsEditModalOpen(true)
    }

    const handleSubmitEdit = async () => {
        if (!editFormData.name.trim()) {
            toast.error('Введите имя ученика')
            return
        }

        setIsSubmitting(true)
        try {
            const response = await fetch(`/api/students/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editFormData),
            })

            if (response.ok) {
                await fetchStudent()
                setIsEditModalOpen(false)
                toast.success('Данные обновлены')
            } else {
                toast.error('Не удалось обновить данные')
            }
        } catch (error) {
            toast.error('Произошла ошибка')
        } finally {
            setIsSubmitting(false)
        }
    }

    // Add Subject Handlers
    const handleOpenAddSubjectModal = () => {
        setSelectedSubjectId('')
        setIsAddSubjectModalOpen(true)
    }

    const handleCreateSubjectForLink = async (name: string) => {
        try {
            // Random color
            const colors = ['#4A6CF7', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316']
            const randomColor = colors[Math.floor(Math.random() * colors.length)]

            const createResponse = await fetch('/api/subjects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, color: randomColor }),
            })

            if (!createResponse.ok) {
                const data = await createResponse.json()
                toast.error(data.error || 'Не удалось создать предмет')
                return
            }

            const newSubject = await createResponse.json()
            await fetchSubjects() // Refresh list
            setSelectedSubjectId(newSubject.id)
            toast.success(`Предмет "${name}" создан. Нажмите "Добавить", чтобы привязать его.`)
        } catch (error) {
            toast.error('Ошибка при создании предмета')
        }
    }

    const handleSubmitSubject = async () => {
        if (!selectedSubjectId) {
            toast.error('Выберите предмет')
            return
        }

        setIsSubmitting(true)
        try {
            const response = await fetch(`/api/subjects/${selectedSubjectId}/students/link`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ studentId: id }),
            })

            if (response.ok) {
                await fetchStudent()
                await fetchSubjects()
                setIsAddSubjectModalOpen(false)
                toast.success('Предмет добавлен')
            } else {
                toast.error('Не удалось добавить предмет')
            }
        } catch (error) {
            toast.error('Произошла ошибка')
        } finally {
            setIsSubmitting(false)
        }
    }

    // Create Lesson Handlers
    const handleOpenCreateLessonModal = () => {
        // Pre-select subject if student has only one
        const defaultSubjectId = student?.subjects.length === 1 ? student.subjects[0].id : ''

        setLessonFormData({
            subjectId: defaultSubjectId,
            date: new Date(),
            price: '',
            isPaid: false,
        })
        setIsCreateLessonModalOpen(true)
    }

    const handleCreateSubject = async (name: string) => {
        try {
            // Random color
            const colors = ['#4A6CF7', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316']
            const randomColor = colors[Math.floor(Math.random() * colors.length)]

            const createResponse = await fetch('/api/subjects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, color: randomColor }),
            })

            if (!createResponse.ok) {
                const data = await createResponse.json()
                toast.error(data.error || 'Не удалось создать предмет')
                return
            }

            const newSubject = await createResponse.json()

            // Link to student
            await fetch(`/api/subjects/${newSubject.id}/students/link`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ studentId: id }),
            })

            await fetchSubjects() // Refresh list
            setLessonFormData(prev => ({ ...prev, subjectId: newSubject.id }))
            toast.success(`Предмет "${name}" создан`)
        } catch (error) {
            toast.error('Ошибка при создании предмета')
        }
    }

    const handleSubmitLesson = async () => {
        if (!lessonFormData.price) {
            toast.error('Укажите цену')
            return
        }

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
                    studentId: id,
                    subjectId: lessonFormData.subjectId || undefined,
                    date: lessonFormData.date.toISOString(),
                    price: Number(lessonFormData.price),
                    isPaid: lessonFormData.isPaid,
                }),
            })

            if (response.ok) {
                await fetchStudent()
                setIsCreateLessonModalOpen(false)
                toast.success('Занятие создано')
            } else {
                toast.error('Не удалось создать занятие')
            }
        } catch (error) {
            toast.error('Произошла ошибка')
        } finally {
            setIsSubmitting(false)
        }
    }

    if (isLoading) {
        return <div className={styles.loading}>Загрузка...</div>
    }

    if (!student) {
        return null
    }

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

    return (
        <div>
            <div className={styles.header}>
                <Button variant="ghost" onClick={() => router.back()}>
                    ← Назад
                </Button>
                <div className={styles.headerActions}>
                    <Button variant="secondary" onClick={handleOpenEditModal}>
                        <EditIcon size={18} />
                        Редактировать
                    </Button>
                    <Button onClick={handleOpenCreateLessonModal}>
                        <PlusIcon size={18} />
                        Создать занятие
                    </Button>
                </div>
            </div>

            <div className={styles.studentHeader}>
                <div
                    className={styles.studentAvatar}
                    style={{ backgroundColor: stringToColor(student.name) }}
                >
                    {getInitials(student.name)}
                </div>
                <div className={styles.studentInfo}>
                    <h1 className={styles.studentName}>{student.name}</h1>
                    {student.contact && (
                        <p className={styles.studentContact}>{student.contact}</p>
                    )}
                </div>
                <div className={styles.actions}>
                    <Button variant="danger" onClick={handleDelete}>
                        Удалить
                    </Button>
                </div>
            </div>

            {student.note && (
                <div className={styles.section}>
                    <h3 className={styles.sectionTitle}>Заметка</h3>
                    <p className={styles.note}>{student.note}</p>
                </div>
            )}

            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h3 className={styles.sectionTitle}>Предметы</h3>
                    <Button variant="ghost" size="small" onClick={handleOpenAddSubjectModal}>
                        <PlusIcon size={16} />
                    </Button>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {student.subjects.length > 0 ? (
                        student.subjects.map((subject) => (
                            <span
                                key={subject.id}
                                style={{
                                    padding: '4px 12px',
                                    borderRadius: '12px',
                                    fontSize: '13px',
                                    fontWeight: 500,
                                    color: subject.color,
                                    backgroundColor: subject.color + '20',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                }}
                            >
                                {subject.name}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        handleDeleteSubject(subject.id)
                                    }}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        padding: '0',
                                        display: 'flex',
                                        alignItems: 'center',
                                        color: subject.color,
                                        opacity: 0.7,
                                        fontSize: '16px',
                                        lineHeight: 1,
                                    }}
                                    title="Удалить предмет"
                                >
                                    ×
                                </button>
                            </span>
                        ))
                    ) : (
                        <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Нет предметов</span>
                    )}
                </div>
            </div>

            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h3 className={styles.sectionTitle}>Занятия ({student._count.lessons})</h3>
                </div>

                {student.lessons.length > 0 ? (
                    <div className={styles.lessonsList}>
                        {student.lessons.map((lesson) => (
                            <div
                                key={lesson.id}
                                className={styles.lessonItem}
                                onClick={() => router.push(`/lessons/${lesson.id}`)}
                            >
                                <div className={styles.lessonDate}>
                                    {format(new Date(lesson.date), 'dd MMMM yyyy, HH:mm', { locale: ru })}
                                </div>
                                <div className={styles.lessonInfo}>
                                    <span className={styles.lessonPrice}>{lesson.price} ₽</span>
                                    <span
                                        className={`${styles.badge} ${lesson.isPaid ? styles.badgePaid : styles.badgeUnpaid
                                            }`}
                                    >
                                        {lesson.isPaid ? 'Оплачено' : 'Не оплачено'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className={styles.emptyLessons}>
                        <p className={styles.emptyText}>Нет занятий</p>
                        <Button size="small" onClick={handleOpenCreateLessonModal}>
                            Создать
                        </Button>
                    </div>
                )}
            </div>

            {/* Edit Student Modal */}
            <Modal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                title="Редактировать ученика"
                footer={
                    <ModalFooter
                        onCancel={() => setIsEditModalOpen(false)}
                        onSubmit={handleSubmitEdit}
                        isLoading={isSubmitting}
                    />
                }
            >
                <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
                    <Input
                        label="Имя"
                        value={editFormData.name}
                        onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                        required
                    />
                    <Input
                        label="Контакт"
                        value={editFormData.contact}
                        onChange={(e) => setEditFormData({ ...editFormData, contact: e.target.value })}
                    />
                    <Input
                        label="Заметка"
                        value={editFormData.note}
                        onChange={(e) => setEditFormData({ ...editFormData, note: e.target.value })}
                    />
                </form>
            </Modal>

            {/* Add Subject Modal */}
            <Modal
                isOpen={isAddSubjectModalOpen}
                onClose={() => setIsAddSubjectModalOpen(false)}
                title="Добавить предмет"
                footer={
                    <ModalFooter
                        onCancel={() => setIsAddSubjectModalOpen(false)}
                        onSubmit={handleSubmitSubject}
                        isLoading={isSubmitting}
                        submitText="Добавить"
                    />
                }
            >
                <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
                    <Dropdown
                        label="Предмет"
                        placeholder="Выберите или создайте предмет"
                        value={selectedSubjectId}
                        onChange={setSelectedSubjectId}
                        options={allSubjects
                            .filter(s => !student?.subjects.some(ss => ss.id === s.id))
                            .map(s => ({ value: s.id, label: s.name }))
                        }
                        searchable
                        creatable
                        onCreate={handleCreateSubjectForLink}
                        menuPosition="relative"
                    />
                </form>
            </Modal>

            {/* Create Lesson Modal */}
            <Modal
                isOpen={isCreateLessonModalOpen}
                onClose={() => setIsCreateLessonModalOpen(false)}
                title="Создать занятие"
                footer={
                    <ModalFooter
                        onCancel={() => setIsCreateLessonModalOpen(false)}
                        onSubmit={handleSubmitLesson}
                        isLoading={isSubmitting}
                        submitText="Создать"
                    />
                }
            >
                <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
                    <Dropdown
                        label="Предмет"
                        placeholder="Выберите или создайте предмет"
                        value={lessonFormData.subjectId}
                        onChange={(value) => setLessonFormData({ ...lessonFormData, subjectId: value })}
                        options={allSubjects.map(s => ({ value: s.id, label: s.name }))}
                        searchable
                        creatable
                        onCreate={handleCreateSubject}
                        menuPosition="relative"
                    />

                    <DateTimePicker
                        label="Дата и время"
                        value={lessonFormData.date}
                        onChange={(date) => setLessonFormData({ ...lessonFormData, date: date || new Date() })}
                    />
                    <Input
                        label="Стоимость"
                        type="number"
                        value={lessonFormData.price}
                        onChange={(e) => setLessonFormData({ ...lessonFormData, price: e.target.value })}
                        required
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                            type="checkbox"
                            id="isPaid"
                            checked={lessonFormData.isPaid}
                            onChange={(e) => setLessonFormData({ ...lessonFormData, isPaid: e.target.checked })}
                            style={{ width: '16px', height: '16px' }}
                        />
                        <label htmlFor="isPaid">Оплачено</label>
                    </div>
                </form>
            </Modal>
        </div>
    )
}