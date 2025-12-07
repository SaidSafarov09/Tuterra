import React from 'react'
import { Modal, ModalFooter } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Dropdown } from '@/components/ui/Dropdown'
import { ContactInput } from '@/components/ui/ContactInput'
import { Student, Subject, LessonFormData } from '@/types'
import { LessonFormWithDateTime } from '@/components/lessons/LessonFormWithDateTime'
import { ContactType } from '@/lib/contactUtils'
import styles from '../../app/(dashboard)/students/[id]/page.module.scss'

interface StudentModalsProps {
    student: Student
    allSubjects: Subject[]
    isSubmitting: boolean

    // Edit Modal
    isEditModalOpen: boolean
    onCloseEditModal: () => void
    onSubmitEdit: () => void
    editFormData: {
        name: string
        contact: string
        contactType?: ContactType
        parentContact?: string
        parentContactType?: ContactType
        note: string
    }
    setEditFormData: (data: any) => void

    // Add Subject Modal
    isAddSubjectModalOpen: boolean
    onCloseAddSubjectModal: () => void
    onSubmitAddSubject: () => void
    selectedSubjectId: string
    setSelectedSubjectId: (id: string) => void
    onCreateSubjectForLink: (name: string) => void

    // Create Lesson Modal
    isCreateLessonModalOpen: boolean
    onCloseCreateLessonModal: () => void
    onSubmitCreateLesson: () => void
    lessonFormData: LessonFormData
    setLessonFormData: (data: any) => void
    onCreateSubject: (name: string) => void
    // Edit Lesson Modal
    isEditLessonModalOpen: boolean
    onCloseEditLessonModal: () => void
    onSubmitEditLesson: () => void
}

export function StudentModals({
    student,
    allSubjects,
    isSubmitting,

    isEditModalOpen,
    onCloseEditModal,
    onSubmitEdit,
    editFormData,
    setEditFormData,

    isAddSubjectModalOpen,
    onCloseAddSubjectModal,
    onSubmitAddSubject,
    selectedSubjectId,
    setSelectedSubjectId,
    onCreateSubjectForLink,

    isCreateLessonModalOpen,
    onCloseCreateLessonModal,
    onSubmitCreateLesson,
    lessonFormData,
    setLessonFormData,
    onCreateSubject,

    isEditLessonModalOpen,
    onCloseEditLessonModal,
    onSubmitEditLesson
}: StudentModalsProps) {
    return (
        <>
            {/* Edit Student Modal */}
            <Modal
                isOpen={isEditModalOpen}
                onClose={onCloseEditModal}
                title="Редактировать ученика"
                footer={
                    <ModalFooter
                        onCancel={onCloseEditModal}
                        onSubmit={onSubmitEdit}
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
                    <ContactInput
                        label="Контакт"
                        value={editFormData.contact}
                        type={editFormData.contactType || 'phone'}
                        onChange={(value, type) => setEditFormData({ ...editFormData, contact: value, contactType: type })}
                    />
                    <ContactInput
                        label="Контакт родителя"
                        value={editFormData.parentContact || ''}
                        type={editFormData.parentContactType || 'phone'}
                        onChange={(value, type) => setEditFormData({ ...editFormData, parentContact: value, parentContactType: type })}
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
                onClose={onCloseAddSubjectModal}
                title="Добавить предмет"
                footer={
                    <ModalFooter
                        onCancel={onCloseAddSubjectModal}
                        onSubmit={onSubmitAddSubject}
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
                        onCreate={onCreateSubjectForLink}
                        menuPosition="relative"
                    />
                </form>
            </Modal>

            {/* Create Lesson Modal */}
            <Modal
                isOpen={isCreateLessonModalOpen}
                onClose={onCloseCreateLessonModal}
                title="Создать занятие"
                footer={
                    <ModalFooter
                        onCancel={onCloseCreateLessonModal}
                        onSubmit={onSubmitCreateLesson}
                        isLoading={isSubmitting}
                        submitText="Создать"
                    />
                }
            >
                <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
                    <LessonFormWithDateTime
                        formData={lessonFormData}
                        setFormData={setLessonFormData}
                        subjects={allSubjects}
                        onCreateSubject={onCreateSubject}
                        isSubmitting={isSubmitting}
                    />
                </form>
            </Modal>

            {/* Edit Lesson Modal */}
            <Modal
                isOpen={isEditLessonModalOpen}
                onClose={onCloseEditLessonModal}
                title="Редактировать занятие"
                footer={
                    <ModalFooter
                        onCancel={onCloseEditLessonModal}
                        onSubmit={onSubmitEditLesson}
                        isLoading={isSubmitting}
                        submitText="Сохранить"
                    />
                }
            >
                <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
                    <LessonFormWithDateTime
                        formData={lessonFormData}
                        setFormData={setLessonFormData}
                        subjects={allSubjects}
                        onCreateSubject={onCreateSubject}
                        isEdit={true}
                        isSubmitting={isSubmitting}
                    />
                    <Input
                        label="Заметки"
                        value={lessonFormData.notes || ''}
                        onChange={(e) => setLessonFormData({ ...lessonFormData, notes: e.target.value })}
                        placeholder="Дополнительные заметки..."
                    />
                </form>
            </Modal>
        </>
    )
}
