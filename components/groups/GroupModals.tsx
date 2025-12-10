import React from 'react'
import { CreateGroupModal } from './CreateGroupModal'
import { LessonFormModal } from '@/components/lessons/LessonFormModal'
import { Group, Subject, Student, LessonFormData } from '@/types'

interface GroupModalsProps {
    group: Group
    allSubjects: Subject[]
    allStudents: Student[]
    isSubmitting: boolean

    isEditModalOpen: boolean
    onCloseEditModal: () => void
    onSubmitEdit: () => void
    editFormData: any
    setEditFormData: (data: any) => void

    isCreateLessonModalOpen: boolean
    onCloseCreateLessonModal: () => void
    onSubmitCreateLesson: () => void
    lessonFormData: LessonFormData
    setLessonFormData: (data: any) => void

    isEditLessonModalOpen: boolean
    onCloseEditLessonModal: () => void
    onSubmitEditLesson: () => void

    onCreateSubject: (name: string) => void
}

export function GroupModals({
    group,
    allSubjects,
    allStudents,
    isSubmitting,

    isEditModalOpen,
    onCloseEditModal,
    onSubmitEdit,
    editFormData,
    setEditFormData,

    isCreateLessonModalOpen,
    onCloseCreateLessonModal,
    onSubmitCreateLesson,
    lessonFormData,
    setLessonFormData,

    isEditLessonModalOpen,
    onCloseEditLessonModal,
    onSubmitEditLesson,

    onCreateSubject
}: GroupModalsProps) {

    const handleChangeEdit = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setEditFormData((prev: any) => ({ ...prev, [name]: value }))
    }

    const handleStudentSelection = (studentId: string) => {
        setEditFormData((prev: any) => {
            const currentIds = prev.studentIds || []
            const newIds = currentIds.includes(studentId)
                ? currentIds.filter((id: string) => id !== studentId)
                : [...currentIds, studentId]
            return { ...prev, studentIds: newIds }
        })
    }

    const handleLessonChange = (name: string, value: any) => {
        setLessonFormData((prev: any) => ({ ...prev, [name]: value }))
    }

    return (
        <>
            <CreateGroupModal
                isOpen={isEditModalOpen}
                onClose={onCloseEditModal}
                onSubmit={onSubmitEdit}
                isSubmitting={isSubmitting}
                error=""
                formData={editFormData}
                setFormData={setEditFormData}
                handleChange={handleChangeEdit}
                handleStudentSelection={handleStudentSelection}
                subjects={allSubjects}
                students={allStudents}
                onCreateSubject={onCreateSubject}
            />

            <LessonFormModal
                isOpen={isCreateLessonModalOpen}
                onClose={onCloseCreateLessonModal}
                onSubmit={onSubmitCreateLesson}
                isSubmitting={isSubmitting}
                isEdit={false}
                formData={lessonFormData}
                setFormData={setLessonFormData}
                students={allStudents}
                groups={[group]}
                subjects={allSubjects}
                error=""
                onStudentChange={() => { }}
                onCreateStudent={() => { }}
                onCreateSubject={onCreateSubject}
                handleChange={handleLessonChange}
                fixedSubjectId={group.subjectId}
                fixedStudentId="" // We don't fix student, we fix group implicitly via formData
            />

            <LessonFormModal
                isOpen={isEditLessonModalOpen}
                onClose={onCloseEditLessonModal}
                onSubmit={onSubmitEditLesson}
                isSubmitting={isSubmitting}
                isEdit={true}
                formData={lessonFormData}
                setFormData={setLessonFormData}
                students={allStudents}
                groups={[group]}
                subjects={allSubjects}
                error=""
                onStudentChange={() => { }}
                onCreateStudent={() => { }}
                onCreateSubject={onCreateSubject}
                handleChange={handleLessonChange}
                fixedSubjectId={group.subjectId}
            />
        </>
    )
}
