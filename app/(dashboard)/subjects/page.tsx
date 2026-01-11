'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { SubjectsIcon, PlusIcon } from '@/components/icons/Icons'
import { SubjectCard } from '@/components/subjects/SubjectCard'
import { SubjectFormModal } from '@/components/subjects/SubjectFormModal'
import { SubjectDetailsModal } from '@/components/subjects/SubjectDetailsModal'
import { AddStudentModal } from '@/components/subjects/AddStudentModal'
import { LessonFormModal } from '@/components/lessons/LessonFormModal'
import { SubjectCardSkeleton } from '@/components/skeletons'
import { useSubjects } from '@/hooks/useSubjects'
import { useSubjectDetail } from '@/hooks/useSubjectDetail'
import { useFetch } from '@/hooks/useFetch'
import { useLessonForm } from '@/hooks/useLessonForm'
import { useCheckLimit } from '@/hooks/useCheckLimit'
import { Subject, Student } from '@/types'
import styles from './page.module.scss'

export default function SubjectsPage() {
    const router = useRouter()
    const isMobile = useMediaQuery('(max-width: 768px)')
    const { subjects, isLoading, createSubject, updateSubject, deleteSubject, refetch } = useSubjects()
    const { data: studentsData, refetch: refetchStudents } = useFetch<Student[]>('/api/students')
    const allStudents = studentsData || []
    const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null)
    const { checkLimit, UpgradeModal } = useCheckLimit()

    const {
        students: subjectStudents,
        groups: subjectGroups,
        isLoadingStudents,
        fetchStudents,
        linkStudent,
        createAndLinkStudent,
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

    const handleCreateClick = () => {
        if (!checkLimit('subjects', subjects.length)) return
        setIsCreateModalOpen(true)
    }

    const {
        formData: lessonFormData,
        setFormData: setLessonFormData,
        isSubmitting: isLessonSubmitting,
        error: lessonError,
        resetForm: resetLessonForm,
        handleChange: handleLessonChange,
        handleStudentChange,
        handleCreateStudent: originalHandleCreateStudent,
        handleCreateSubject: originalHandleCreateSubject,
        handleSubmit: submitLessonForm,
        handleGroupChange,
    } = useLessonForm(
        () => {
            setIsCreateLessonModalOpen(false)
            if (selectedSubject) {
                fetchStudents(selectedSubject.id)
            }
            refetch()
        },
        refetchStudents,
        refetch,
        () => selectedSubject && fetchStudents(selectedSubject.id)
    )

    const handleCreateStudent = (name: string) => {
        if (!checkLimit('students', allStudents.length)) return
        originalHandleCreateStudent(name)
    }

    const handleCreateSubject = (name: string) => {
        if (!checkLimit('subjects', subjects.length)) return
        originalHandleCreateSubject(name)
    }

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
        setIsEditModalOpen(false)
        return result
    }

    const handleDeleteSubject = (subject: Subject) => {
        setDeleteConfirm({ isOpen: true, subject })
    }

    const confirmDelete = async () => {
        if (!deleteConfirm.subject) return
        const subjectToDelete = deleteConfirm.subject
        setDeleteConfirm({ isOpen: false, subject: null })
        // Don't await - let it run in background
        deleteSubject(subjectToDelete.id).then((result) => {
            if (result.success) {
                if (selectedSubject?.id === subjectToDelete.id) {
                    handleCloseDetailsModal()
                }
            }
        })
    }

    const handleAddStudent = async (mode: 'create' | 'link', data: any) => {
        if (!selectedSubject) return { success: false }

        if (mode === 'create') {
            if (!checkLimit('students', allStudents.length)) return { success: false }
            return await createAndLinkStudent(selectedSubject.id, data)
        } else {
            return await linkStudent(selectedSubject.id, data.studentId)
        }
    }

    const handleOpenCreateLessonModal = () => {
        resetLessonForm()
        if (selectedSubject) {
            setLessonFormData(prev => ({ ...prev, subjectId: selectedSubject.id }))
        }
        setIsCreateLessonModalOpen(true)
    }

    const handleOpenAddStudentModal = () => {
        setIsAddStudentModalOpen(true)
    }

    const customTitle = selectedSubject ? (
        <>
            Занятие по предмету {isMobile ? <br /> : <></>}
            <span style={{ color: selectedSubject.color }}>{selectedSubject.name}</span>
        </>
    ) : undefined

    return (
        <div>
            <div className={styles.header}>
                <div className={styles.headerText}>
                    <h1 className={styles.title}>Предметы</h1>
                    <p className={styles.subtitle}>Ваши учебные дисциплины</p>
                </div>
                <Button onClick={handleCreateClick}>
                    <PlusIcon size={20} />
                    Добавить предмет
                </Button>
            </div>

            {isLoading ? (
                <div className={styles.subjectsGrid}>
                    <SubjectCardSkeleton />
                    <SubjectCardSkeleton />
                    <SubjectCardSkeleton />
                    <SubjectCardSkeleton />
                    <SubjectCardSkeleton />
                    <SubjectCardSkeleton />
                </div>
            ) : subjects.length === 0 ? (
                <div className={styles.emptyState}>
                    <div className={styles.emptyStateIcon}>
                        <SubjectsIcon size={64} color="#9CA3AF" />
                    </div>
                    <h2 className={styles.emptyStateTitle}>Нет предметов</h2>
                    <p className={styles.emptyStateText}>
                        Добавьте первый предмет, чтобы начать работу
                    </p>
                    <Button onClick={handleCreateClick}>Добавить предмет</Button>
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
                groups={subjectGroups}
                isLoading={isLoadingStudents}
                onAddStudent={handleOpenAddStudentModal}
                onCreateLesson={handleOpenCreateLessonModal}
            />

            <AddStudentModal
                isOpen={isAddStudentModalOpen}
                onClose={() => setIsAddStudentModalOpen(false)}
                subject={selectedSubject}
                allStudents={allStudents || []}
                onSubmit={handleAddStudent}
            />

            <LessonFormModal
                isOpen={isCreateLessonModalOpen}
                onClose={() => setIsCreateLessonModalOpen(false)}
                isEdit={false}
                formData={lessonFormData}
                setFormData={setLessonFormData}
                students={allStudents}
                subjects={subjects}
                isSubmitting={isLessonSubmitting}
                error={lessonError}
                onSubmit={() => submitLessonForm(false)}
                onStudentChange={handleStudentChange}
                handleGroupChange={handleGroupChange}
                onCreateStudent={handleCreateStudent}
                onCreateSubject={handleCreateSubject}
                handleChange={handleLessonChange}
                fixedSubjectId={selectedSubject?.id}
                groups={subjectGroups}
                customTitle={customTitle}
            />

            <ConfirmDialog
                isOpen={deleteConfirm.isOpen}
                onClose={() => setDeleteConfirm({ isOpen: false, subject: null })}
                onConfirm={confirmDelete}
                title="Удалить предмет?"
                message={`Вы уверены, что хотите удалить предмет "${deleteConfirm.subject?.name}"? Это действие нельзя отменить. Все ближайшие связанные занятия также будут удалены.`}
                confirmText="Удалить"
                cancelText="Отмена"
                variant="danger"
            />
            {UpgradeModal}
        </div>
    )
}
