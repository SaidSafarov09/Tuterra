'use client'

import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { UsersGroupIcon, SearchIcon, PlusIcon } from '@/components/icons/Icons'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { Modal, ModalFooter } from '@/components/ui/Modal'
import { useModalStore } from '@/store/useModalStore'
import styles from './page.module.scss'

interface Student {
    id: string
    name: string
    contact?: string | null
    note?: string | null
    subjectId?: string | null
    subject?: {
        name: string
        color: string
    }
    _count: {
        lessons: number
    }
}

interface Subject {
    id: string
    name: string
    color: string
}

export default function StudentsPage() {
    const router = useRouter()

    const [students, setStudents] = useState<Student[]>([])
    const [subjects, setSubjects] = useState<Subject[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState('')

    const [formData, setFormData] = useState({
        name: '',
        contact: '',
        note: '',
        subjectId: '',
        subjectName: '', // For custom subject input
    })

    const [selectedSubjectFilter, setSelectedSubjectFilter] = useState('all')
    const [showSubjectSuggestions, setShowSubjectSuggestions] = useState(false)
    const subjectInputRef = useRef<HTMLInputElement>(null)

    const { isOpen, openModal, closeModal } = useModalStore()

    useEffect(() => {
        fetchStudents()
        fetchSubjects()
    }, [])

    // Close suggestions on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (subjectInputRef.current && !subjectInputRef.current.contains(event.target as Node)) {
                setShowSubjectSuggestions(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const fetchStudents = async () => {
        try {
            const response = await fetch('/api/students')
            if (response.ok) {
                setStudents(await response.json())
            } else {
                toast.error('Не удалось загрузить учеников')
            }
        } catch (e) {
            toast.error('Произошла ошибка при загрузке учеников')
        } finally {
            setIsLoading(false)
        }
    }

    const fetchSubjects = async () => {
        try {
            const response = await fetch('/api/subjects')
            if (response.ok) {
                setSubjects(await response.json())
            } else {
                toast.error('Не удалось загрузить предметы')
            }
        } catch (e) {
            toast.error('Произошла ошибка при загрузке предметов')
        }
    }

    // -----------------------------
    // MODAL LOGIC
    // -----------------------------

    const handleOpenModal = () => {
        setFormData({
            name: '',
            contact: '',
            note: '',
            subjectId: '',
            subjectName: '',
        })
        setError('')
        openModal('create')
    }

    const handleCloseModal = () => {
        closeModal()
        setError('')
        setShowSubjectSuggestions(false)
    }

    // -----------------------------
    // FORM HANDLERS
    // -----------------------------

    const handleChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
            const { name, value } = e.target
            setFormData((prev) => ({ ...prev, [name]: value }))
        },
        []
    )

    const handleSubjectChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        setFormData(prev => ({
            ...prev,
            subjectName: value,
            subjectId: '', // Reset ID when typing, will rely on name or selection
        }))
        setShowSubjectSuggestions(true)
    }

    const selectSubject = (subject: Subject) => {
        setFormData(prev => ({
            ...prev,
            subjectId: subject.id,
            subjectName: subject.name,
        }))
        setShowSubjectSuggestions(false)
    }

    const handleSubmit = async () => {
        if (!formData.name.trim()) {
            toast.error('Введите имя ученика')
            return
        }

        setIsSubmitting(true)
        setError('')

        try {
            const response = await fetch('/api/students', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            })

            if (response.ok) {
                await fetchStudents()
                await fetchSubjects() // Refresh subjects in case a new one was created
                handleCloseModal()
                toast.success('Ученик успешно добавлен')
            } else {
                const data = await response.json()
                setError(data.error || 'Произошла ошибка')
            }
        } catch (error) {
            toast.error('Произошла ошибка при создании ученика')
            setError('Произошла ошибка при создании ученика')
        } finally {
            setIsSubmitting(false)
        }
    }

    // -----------------------------
    // HELPERS
    // -----------------------------

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

    // -----------------------------
    // FILTERED LIST
    // -----------------------------

    const filteredStudents = useMemo(() => {
        if (selectedSubjectFilter === 'all') return students
        return students.filter((s) => s.subjectId === selectedSubjectFilter)
    }, [students, selectedSubjectFilter])

    const filteredSubjects = useMemo(() => {
        if (!formData.subjectName) return subjects
        return subjects.filter(s => s.name.toLowerCase().includes(formData.subjectName.toLowerCase()))
    }, [subjects, formData.subjectName])

    // -----------------------------
    // RENDER
    // -----------------------------

    if (isLoading) {
        return <div className={styles.loading}>Загрузка...</div>
    }

    return (
        <div>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.headerText}>
                    <h1 className={styles.title}>Ученики</h1>
                    <p className={styles.subtitle}>Управляйте списком ваших учеников</p>
                </div>
                <Button onClick={handleOpenModal}>
                    <PlusIcon size={20} />
                    Добавить ученика
                </Button>
            </div>

            {/* Subject Filters */}
            {subjects.length > 0 && students.length > 0 && (
                <div className={styles.filters}>
                    <button
                        className={`${styles.filterChip} ${selectedSubjectFilter === 'all' ? styles.filterChipActive : ''
                            }`}
                        onClick={() => setSelectedSubjectFilter('all')}
                    >
                        Все ({students.length})
                    </button>

                    {subjects.map((subject) => {
                        const count = students.filter((s) => s.subjectId === subject.id).length
                        if (count === 0) return null

                        return (
                            <button
                                key={subject.id}
                                className={`${styles.filterChip} ${selectedSubjectFilter === subject.id
                                    ? styles.filterChipActive
                                    : ''
                                    }`}
                                style={{
                                    borderColor: subject.color,
                                    color:
                                        selectedSubjectFilter === subject.id
                                            ? 'white'
                                            : subject.color,
                                    background:
                                        selectedSubjectFilter === subject.id
                                            ? subject.color
                                            : `${subject.color}10`,
                                }}
                                onClick={() => setSelectedSubjectFilter(subject.id)}
                            >
                                {subject.name} ({count})
                            </button>
                        )
                    })}
                </div>
            )}

            {/* Empty State / Students Grid */}
            {students.length === 0 ? (
                <div className={styles.emptyState}>
                    <div className={styles.emptyStateIcon}><UsersGroupIcon size={64} color="#9CA3AF" /></div>
                    <h2 className={styles.emptyStateTitle}>Нет учеников</h2>
                    <p className={styles.emptyStateText}>
                        Добавьте первого ученика, чтобы начать работу
                    </p>
                    <Button onClick={handleOpenModal}>Добавить ученика</Button>
                </div>
            ) : (
                <div className={styles.studentsGrid}>
                    {filteredStudents.map((student) => (
                        <div
                            key={student.id}
                            className={styles.studentCard}
                            onClick={() => router.push(`/students/${student.id}`)}
                        >
                            <div className={styles.studentHeader}>
                                <div
                                    className={styles.studentAvatarFallback}
                                    style={{ backgroundColor: stringToColor(student.name) }}
                                >
                                    {getInitials(student.name)}
                                </div>
                                <div className={styles.studentInfo}>
                                    <div className={styles.nameRow}>
                                        <h3 className={styles.studentName}>{student.name}</h3>
                                        {student.subject && (
                                            <span
                                                className={styles.subjectBadge}
                                                style={{
                                                    color: student.subject.color,
                                                    backgroundColor:
                                                        student.subject.color + '20',
                                                }}
                                            >
                                                {student.subject.name}
                                            </span>
                                        )}
                                    </div>
                                    {student.contact && (
                                        <p className={styles.studentContact}>
                                            {student.contact}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {student.note && (
                                <p className={styles.studentNote}>{student.note}</p>
                            )}

                            <div className={styles.studentStats}>
                                <div className={styles.stat}>
                                    <p className={styles.statLabel}>Занятий</p>
                                    <p className={styles.statValue}>
                                        {student._count.lessons}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            <Modal
                isOpen={isOpen}
                onClose={handleCloseModal}
                title="Добавить ученика"
                footer={
                    <ModalFooter
                        onCancel={handleCloseModal}
                        onSubmit={handleSubmit}
                        isLoading={isSubmitting}
                        submitText="Добавить"
                    />
                }
            >
                <div className={styles.modalContent}>
                    <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
                        {error && <div style={{ color: 'var(--error)' }}>{error}</div>}

                        <Input
                            label="Имя"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            placeholder="Иван Иванов"
                            disabled={isSubmitting}
                        />

                        <div className={styles.subjectInputWrapper} ref={subjectInputRef}>
                            <Input
                                label="Предмет"
                                name="subjectName"
                                value={formData.subjectName}
                                onChange={handleSubjectChange}
                                onFocus={() => setShowSubjectSuggestions(true)}
                                placeholder="Выберите или введите новый предмет"
                                disabled={isSubmitting}
                                autoComplete="off"
                            />
                            {showSubjectSuggestions && filteredSubjects.length > 0 && (
                                <div className={styles.suggestionsList}>
                                    {filteredSubjects.map(subject => (
                                        <div
                                            key={subject.id}
                                            className={styles.suggestionItem}
                                            onClick={() => selectSubject(subject)}
                                        >
                                            <div className={styles.suggestionColor} style={{ backgroundColor: subject.color }} />
                                            {subject.name}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <Input
                            label="Контакт"
                            name="contact"
                            value={formData.contact}
                            onChange={handleChange}
                            placeholder="@telegram, телефон или email"
                            disabled={isSubmitting}
                        />

                        <Textarea
                            label="Заметка"
                            name="note"
                            value={formData.note}
                            onChange={handleChange}
                            placeholder="Дополнительная информация об ученике"
                            disabled={isSubmitting}
                        />
                    </form>
                </div>
            </Modal>
        </div>
    )
}