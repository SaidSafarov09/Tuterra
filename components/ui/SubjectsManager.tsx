'use client'

import React, { useState, useEffect } from 'react'
import { PlusIcon, EditIcon, DeleteIcon } from '@/components/icons/Icons'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal, ModalFooter } from '@/components/ui/Modal'
import styles from './SubjectsManager.module.scss'

interface Subject {
    id: string
    name: string
    color: string
    _count?: {
        students: number
        lessons: number
    }
}

const PRESET_COLORS = [
    '#4A6CF7', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
    '#EC4899', '#14B8A6', '#F97316', '#3B82F6', '#84CC16',
]

export const SubjectsManager: React.FC = () => {
    const [subjects, setSubjects] = useState<Subject[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingSubject, setEditingSubject] = useState<Subject | null>(null)
    const [formData, setFormData] = useState({ name: '', color: PRESET_COLORS[0] })
    const [error, setError] = useState('')

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

    const handleOpenModal = (subject?: Subject) => {
        if (subject) {
            setEditingSubject(subject)
            setFormData({ name: subject.name, color: subject.color })
        } else {
            setEditingSubject(null)
            setFormData({ name: '', color: PRESET_COLORS[0] })
        }
        setError('')
        setIsModalOpen(true)
    }

    const handleCloseModal = () => {
        setIsModalOpen(false)
        setEditingSubject(null)
        setError('')
    }

    const handleSubmit = async () => {
        if (!formData.name.trim()) {
            setError('Введите название предмета')
            return
        }

        try {
            const url = editingSubject ? `/api/subjects/${editingSubject?.id}` : '/api/subjects'
            const method = editingSubject ? 'PUT' : 'POST'

            const response = await fetch(url, {
                method,
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
            console.error('Failed to save subject:', error)
            setError('Произошла ошибка при сохранении')
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Вы уверены, что хотите удалить этот предмет?')) {
            return
        }

        try {
            const response = await fetch(`/api/subjects/${id}`, {
                method: 'DELETE',
            })

            if (response.ok) {
                await fetchSubjects()
            } else {
                const data = await response.json()
                alert(data.error || 'Произошла ошибка при удалении')
            }
        } catch (error) {
            console.error('Failed to delete subject:', error)
            alert('Произошла ошибка при удалении')
        }
    }

    if (isLoading) {
        return <div className={styles.loading}>Загрузка...</div>
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2 className={styles.title}>Мои предметы</h2>
                <Button size="small" onClick={() => handleOpenModal()}>
                    <PlusIcon size={16} />
                    Добавить
                </Button>
            </div>

            {subjects.length === 0 ? (
                <div className={styles.emptyState}>
                    <p>Нет добавленных предметов</p>
                    <Button variant="ghost" onClick={() => handleOpenModal()}>
                        Добавить первый предмет
                    </Button>
                </div>
            ) : (
                <div className={styles.subjectsGrid}>
                    {subjects.map((subject) => (
                        <div key={subject?.id} className={styles.subjectCard}>
                            <div className={styles.subjectHeader}>
                                <div className={styles.colorIndicator} style={{ backgroundColor: subject.color }} />
                                <h3 className={styles.subjectName}>{subject.name}</h3>
                            </div>
                            <div className={styles.subjectStats}>
                                <div className={styles.stat}>
                                    <span className={styles.statValue}>{subject._count?.students || 0}</span>
                                    <span className={styles.statLabel}>учеников</span>
                                </div>
                                <div className={styles.stat}>
                                    <span className={styles.statValue}>{subject._count?.lessons || 0}</span>
                                    <span className={styles.statLabel}>занятий</span>
                                </div>
                            </div>
                            <div className={styles.actions}>
                                <button
                                    className={styles.actionButton}
                                    onClick={() => handleOpenModal(subject)}
                                    title="Редактировать"
                                >
                                    <EditIcon size={16} />
                                </button>
                                <button
                                    className={`${styles.actionButton} ${styles.deleteButton}`}
                                    onClick={() => handleDelete(subject?.id)}
                                    title="Удалить"
                                >
                                    <DeleteIcon size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={editingSubject ? 'Редактировать предмет' : 'Добавить предмет'}
                footer={
                    <ModalFooter
                        onCancel={handleCloseModal}
                        onSubmit={handleSubmit}
                        submitText={editingSubject ? 'Сохранить' : 'Добавить'}
                    />
                }
            >
                <div className={styles.modalContent}>
                    {error && <div className={styles.error}>{error}</div>}

                    <Input
                        label="Название предмета"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Например: Математика, Английский язык"
                        required
                    />

                    <div className={styles.colorPicker}>
                        <label className={styles.label}>Цвет</label>
                        <div className={styles.colors}>
                            {PRESET_COLORS.map((color) => (
                                <button
                                    key={color}
                                    type="button"
                                    className={`${styles.colorButton} ${formData.color === color ? styles.colorButtonActive : ''
                                        }`}
                                    style={{ backgroundColor: color }}
                                    onClick={() => setFormData({ ...formData, color })}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    )
}
