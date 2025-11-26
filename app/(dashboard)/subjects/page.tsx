'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal, ModalFooter } from '@/components/ui/Modal'
import { useModalStore } from '@/store/useModalStore'
import { SubjectsIcon } from '@/components/icons/Icons'
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
            }
        } catch (error) {
            console.error('Failed to fetch subjects:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleOpenModal = () => {
        setFormData({ name: '', color: '#4A6CF7' })
        setError('')
        openModal('create')
    }

    const handleCloseModal = () => {
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
            setError('Введите название предмета')
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
                handleCloseModal()
            } else {
                const data = await response.json()
                setError(data.error || 'Произошла ошибка')
            }
        } catch (error) {
            console.error('Failed to create subject:', error)
            setError('Произошла ошибка при создании предмета')
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
                    <h1 className={styles.title}>Предметы</h1>
                    <p className={styles.subtitle}>Управляйте списком предметов, которые вы преподаете</p>
                </div>
                <Button onClick={handleOpenModal}>+&nbsp;&nbsp; Добавить предмет</Button>
            </div>

            {subjects.length === 0 ? (
                <div className={styles.emptyState}>
                    <div className={styles.emptyStateIcon}>
                        <SubjectsIcon size={64} color="var(--text-muted)" />
                    </div>
                    <h2 className={styles.emptyStateTitle}>Нет предметов</h2>
                    <p className={styles.emptyStateText}>
                        Добавьте первый предмет, чтобы начать работу
                    </p>
                    <Button onClick={handleOpenModal}>Добавить предмет</Button>
                </div>
            ) : (
                <div className={styles.subjectsGrid}>
                    {subjects.map((subject) => (
                        <div
                            key={subject?.id}
                            className={styles.subjectCard}
                            style={{ '--subject-color': subject.color } as React.CSSProperties}
                        // onClick={() => router.push(`/subjects/${subject?.id}`)}
                        >
                            <div className={styles.subjectHeader}>
                                <div className={styles.subjectInfo}>
                                    <h3 className={styles.subjectName}>{subject.name}</h3>
                                </div>
                                <div
                                    className={styles.subjectColor}
                                    style={{ background: subject.color }}
                                />
                            </div>

                            <div className={styles.subjectStats}>
                                <div className={styles.stat}>
                                    <p className={styles.statLabel}>Учеников</p>
                                    <p className={styles.statValue}>{subject._count.students}</p>
                                </div>
                                <div className={styles.stat}>
                                    <p className={styles.statLabel}>Занятий</p>
                                    <p className={styles.statValue}>{subject._count.lessons}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Modal
                isOpen={isOpen}
                onClose={handleCloseModal}
                title="Добавить предмет"
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
        </div>
    )
}
