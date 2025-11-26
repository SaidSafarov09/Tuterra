'use client'

import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { Dropdown } from '@/components/ui/Dropdown'
import { Modal, ModalFooter } from '@/components/ui/Modal'
import { useModalStore } from '@/store/useModalStore'
import { AvatarEditor } from '@/components/ui/AvatarEditor'
import { StudentAvatar } from '@/components/ui/StudentAvatar'
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
    skinColor?: string
    hairStyle?: string
    hairColor?: string
    eyeStyle?: string
    accessory?: string
    bgColor?: string
    _count: {
        lessons: number
    }
}

interface Subject {
    id: string
    name: string
    color: string
}

const DEFAULT_AVATAR = {
    skinColor: '#F4C2A6',
    hairStyle: 'short',
    hairColor: '#2C1B18',
    eyeStyle: 'default',
    accessory: 'none',
    bgColor: '#E3F2FD',
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
        ...DEFAULT_AVATAR,
    })

    const [selectedSubjectFilter, setSelectedSubjectFilter] = useState('all')

    const { isOpen, openModal, closeModal } = useModalStore()

    useEffect(() => {
        fetchStudents()
        fetchSubjects()
    }, [])

    const fetchStudents = async () => {
        try {
            const response = await fetch('/api/students')
            if (response.ok) {
                setStudents(await response.json())
            }
        } catch (e) {
            console.error('Failed to fetch students:', e)
        } finally {
            setIsLoading(false)
        }
    }

    const fetchSubjects = async () => {
        try {
            const response = await fetch('/api/subjects')
            if (response.ok) {
                setSubjects(await response.json())
            }
        } catch (e) {
            console.error('Failed to fetch subjects:', e)
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
            ...DEFAULT_AVATAR,
        })
        setError('')
        openModal('create')
    }

    const handleCloseModal = () => {
        closeModal()
        setError('')
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

    const handleAvatarChange = useCallback((config: any) => {
        setFormData((prev) => ({ ...prev, ...config }))
    }, [])

    // 🔥 Мемоизированная конфигурация, не меняется при каждом рендере
    const initialAvatarConfig = useMemo(
        () => ({
            skinColor: formData.skinColor,
            hairStyle: formData.hairStyle,
            hairColor: formData.hairColor,
            eyeStyle: formData.eyeStyle,
            accessory: formData.accessory,
            bgColor: formData.bgColor,
        }),
        [
            formData.skinColor,
            formData.hairStyle,
            formData.hairColor,
            formData.eyeStyle,
            formData.accessory,
            formData.bgColor,
        ]
    )

    const handleSubmit = async () => {
        if (!formData.name.trim()) {
            setError('Введите имя ученика')
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
                handleCloseModal()
            } else {
                const data = await response.json()
                setError(data.error || 'Произошла ошибка')
            }
        } catch (error) {
            console.error('Failed to create student:', error)
            setError('Произошла ошибка при создании ученика')
        } finally {
            setIsSubmitting(false)
        }
    }

    // -----------------------------
    // FILTERED LIST
    // -----------------------------

    const filteredStudents = useMemo(() => {
        if (selectedSubjectFilter === 'all') return students
        return students.filter((s) => s.subjectId === selectedSubjectFilter)
    }, [students, selectedSubjectFilter])

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
                <Button onClick={handleOpenModal}>+ Добавить ученика</Button>
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
                    <div className={styles.emptyStateIcon}>👥</div>
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
                                <StudentAvatar
                                    skinColor={student.skinColor}
                                    hairStyle={student.hairStyle}
                                    hairColor={student.hairColor}
                                    eyeStyle={student.eyeStyle}
                                    accessory={student.accessory}
                                    bgColor={student.bgColor}
                                    size={60}
                                    className={styles.studentAvatar}
                                />
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
                    <div className={styles.avatarSection}>
                        <AvatarEditor
                            initialConfig={initialAvatarConfig}
                            onChange={handleAvatarChange}
                        />
                    </div>

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

                        <Dropdown
                            label="Предмет"
                            placeholder="Выберите предмет (необязательно)"
                            value={formData.subjectId}
                            onChange={(value) =>
                                setFormData((prev) => ({ ...prev, subjectId: value }))
                            }
                            options={subjects.map((s) => ({
                                value: s.id,
                                label: s.name,
                            }))}
                            searchable
                            disabled={isSubmitting}
                        />

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