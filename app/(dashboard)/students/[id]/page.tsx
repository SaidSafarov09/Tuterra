'use client'

import React, { use as usePromise } from 'react'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { StudentHeader } from '@/components/students/StudentHeader'
import { StudentSubjects } from '@/components/students/StudentSubjects'
import { StudentLessons } from '@/components/students/StudentLessons'
import { StudentModals } from '@/components/students/StudentModals'
import { useStudentDetail } from '@/hooks/useStudentDetail'
import styles from './page.module.scss'
import { Lesson } from '@/types'

export default function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = usePromise(params)

    const {
        student,
        allSubjects,
        isLoading,
        isSubmitting,


        isEditModalOpen, setIsEditModalOpen,
        isAddSubjectModalOpen, setIsAddSubjectModalOpen,
        isCreateLessonModalOpen, setIsCreateLessonModalOpen,

        editFormData, setEditFormData,
        selectedSubjectId, setSelectedSubjectId,
        lessonFormData, setLessonFormData,

        deleteStudentConfirm, setDeleteStudentConfirm,
        deleteSubjectConfirm, setDeleteSubjectConfirm,

        handleDeleteStudent,
        handleDeleteSubject,
        handleUpdateStudent,
        handleAddSubject,
        handleCreateLesson,
        handleCreateSubject,
        handleEditLesson,
        handleDeleteLesson,
        handleTogglePaidStatus,

        // Openers
        openEditModal,
        openCreateLessonModal
    } = useStudentDetail(id)

    if (isLoading) {
        return <div className={styles.loading}>Загрузка...</div>
    }

    if (!student) {
        return null
    }

    return (
        <div>
            <StudentHeader
                student={student}
                onEdit={openEditModal}
                onCreateLesson={openCreateLessonModal}
                onDelete={() => setDeleteStudentConfirm(true)}
            />

            <StudentSubjects
                student={student}
                onAddSubject={() => {
                    setSelectedSubjectId('')
                    setIsAddSubjectModalOpen(true)
                }}
                onDeleteSubject={(subjectId) => setDeleteSubjectConfirm(subjectId)}
            />

            <StudentLessons
                lessons={(student.lessons || []).map(l => ({
                    ...l,
                    isCanceled: false,
                    student: { id: student.id, name: student.name },
                    subject: l.subject || null
                }))}
                student={student}
                onCreateLesson={openCreateLessonModal}
                onEditLesson={handleEditLesson}
                onDeleteLesson={handleDeleteLesson}
                onTogglePaidStatus={handleTogglePaidStatus}
            />

            <StudentModals
                student={student}
                allSubjects={allSubjects}
                isSubmitting={isSubmitting}

                isEditModalOpen={isEditModalOpen}
                onCloseEditModal={() => setIsEditModalOpen(false)}
                onSubmitEdit={handleUpdateStudent}
                editFormData={editFormData}
                setEditFormData={setEditFormData}

                isAddSubjectModalOpen={isAddSubjectModalOpen}
                onCloseAddSubjectModal={() => setIsAddSubjectModalOpen(false)}
                onSubmitAddSubject={handleAddSubject}
                selectedSubjectId={selectedSubjectId}
                setSelectedSubjectId={setSelectedSubjectId}
                onCreateSubjectForLink={(name) => handleCreateSubject(name, true)}

                isCreateLessonModalOpen={isCreateLessonModalOpen}
                onCloseCreateLessonModal={() => setIsCreateLessonModalOpen(false)}
                onSubmitCreateLesson={handleCreateLesson}
                lessonFormData={lessonFormData}
                setLessonFormData={setLessonFormData}
                onCreateSubject={(name) => handleCreateSubject(name, false)}
            />

            <ConfirmDialog
                isOpen={deleteStudentConfirm}
                onClose={() => setDeleteStudentConfirm(false)}
                onConfirm={handleDeleteStudent}
                title="Удалить ученика?"
                message="Вы уверены, что хотите удалить этого ученика? Все занятия и история оплат также будут удалены. Это действие нельзя отменить."
                confirmText="Удалить"
                cancelText="Отмена"
                variant="danger"
            />

            <ConfirmDialog
                isOpen={!!deleteSubjectConfirm}
                onClose={() => setDeleteSubjectConfirm(null)}
                onConfirm={handleDeleteSubject}
                title="Удалить предмет?"
                message="Вы уверены, что хотите удалить этот предмет у ученика?"
                confirmText="Удалить"
                cancelText="Отмена"
                variant="danger"
            />
        </div>
    )
}