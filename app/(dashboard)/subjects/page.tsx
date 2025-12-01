'use client'

import React, { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { SubjectsIcon, PlusIcon } from '@/components/icons/Icons'
import { SubjectCard } from '@/components/subjects/SubjectCard'
import { SubjectFormModal } from '@/components/subjects/SubjectFormModal'
import { SubjectDetailsModal } from '@/components/subjects/SubjectDetailsModal'
import { AddStudentModal } from '@/components/subjects/AddStudentModal'
import { CreateLessonModal } from '@/components/subjects/CreateLessonModal'
import { useSubjects } from '@/hooks/useSubjects'
import { useSubjectDetail } from '@/hooks/useSubjectDetail'
import { useFetch } from '@/hooks/useFetch'
import { Subject, Student } from '@/types'
import styles from './page.module.scss'

export default function SubjectsPage() {
    const { subjects, isLoading, createSubject, updateSubject, deleteSubject, refetch } = useSubjects()
    const { data: allStudents = [] } = useFetch<Student[]>('/api/students')
    const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null)

    const {
        students: subjectStudents,
        isLoadingStudents,
        fetchStudents,
        linkStudent,
        createAndLinkStudent,
        createLesson
    } = useSubjectDetail(selectedSubject, refetch)

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
    const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false)
    const [isCreateLessonModalOpen, setIsCreateLessonModalOpen] = useState(false)
    const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; subject: Subject | null }>({
        isOpen: false,
        subject: null,
    })
    const [editSubjectData, setEditSubjectData] = useState({ id: '', name: '', color: '#4A6CF7' })

    const handleSubjectClick = (subject: Subject) => {
        setSelectedSubject(subject)
        setIsDetailsModalOpen(true)
        fetchStudents(subject.id)
    }

    const handleCloseDetailsModal = () => {
        setIsDetailsModalOpen(false)
        setSelectedSubject(null)
    }

    const handleOpenEditModal = (subject: Subject) => {
        setEditSubjectData({
            id: subject.id,
            name: subject.name,
            color: subject.color,
        })
        setIsEditModalOpen(true)
    }

    const handleEditSubject = async (data: { name: string; color: string }) => {
        const result = await updateSubject(editSubjectData.id, data)

        if (result.success && selectedSubject?.id === editSubjectData.id) {
            setSelectedSubject(prev => prev ? { ...prev, name: data.name, color: data.color } : null)
        }

        return result
    }

    const handleDeleteSubject = (subject: Subject) => {
        setDeleteConfirm({ isOpen: true, subject })
    }

    const confirmDelete = async () => {
        if (!deleteConfirm.subject) return
        await deleteSubject(deleteConfirm.subject.id)
        setDeleteConfirm({ isOpen: false, subject: null })
    }

    const handleAddStudent = async (mode: 'create' | 'link', data: any) => {
        if (!selectedSubject) return { success: false }

        if (mode === 'create') {
            return await createAndLinkStudent(selectedSubject.id, data)
        } else {
            return await linkStudent(selectedSubject.id, data.studentId)
        }
    }

    const handleCreateLesson = async (data: {
        studentId: string
        date: Date
        price: string
        isPaid: boolean
    }) => {
        if (!selectedSubject) return { success: false }

        if (data.date < new Date()) {
            toast.error('Нельзя создавать занятия в прошедшем времени')
            return { success: false }
        }

        return await createLesson(selectedSubject.id, data)
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
                <Button onClick={() => setIsCreateModalOpen(true)}>
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
                    <Button onClick={() => setIsCreateModalOpen(true)}>Добавить предмет</Button>
                </div>
            ) : (
                <div className={styles.subjectsGrid}>
                    {subjects.map((subject) => (
                        <SubjectCard
                            key={subject.id}
                            subject={subject}
                            onEdit={handleOpenEditModal}
                            onDelete={handleDeleteSubject}
                            onClick={handleSubjectClick}
                        />
                    ))}
                </div>
            )}

            <SubjectFormModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSubmit={createSubject}
                title="Добавить предмет"
                submitText="Добавить"
            />

            <SubjectFormModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onSubmit={handleEditSubject}
                title="Редактировать предмет"
                submitText="Сохранить"
                initialData={editSubjectData}
            />

            <SubjectDetailsModal
                isOpen={isDetailsModalOpen}
                onClose={handleCloseDetailsModal}
                subject={selectedSubject}
                students={subjectStudents}
                isLoading={isLoadingStudents}
                onAddStudent={() => setIsAddStudentModalOpen(true)}
                onCreateLesson={() => setIsCreateLessonModalOpen(true)}
            />

            <AddStudentModal
                isOpen={isAddStudentModalOpen}
                onClose={() => setIsAddStudentModalOpen(false)}
                subject={selectedSubject}
                allStudents={allStudents || []}
                onSubmit={handleAddStudent}
            />

            <CreateLessonModal
                isOpen={isCreateLessonModalOpen}
                onClose={() => setIsCreateLessonModalOpen(false)}
                students={subjectStudents}
                onSubmit={handleCreateLesson}
            />

            <ConfirmDialog
                isOpen={deleteConfirm.isOpen}
                onClose={() => setDeleteConfirm({ isOpen: false, subject: null })}
                onConfirm={confirmDelete}
                title="Удалить предмет?"
                message={`Вы уверены, что хотите удалить предмет "${deleteConfirm.subject?.name}"? Это действие нельзя отменить. Все связанные занятия также будут удалены.`}
                confirmText="Удалить"
                cancelText="Отмена"
                variant="danger"
            />
        </div>
    )
}
