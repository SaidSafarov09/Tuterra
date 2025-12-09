import React from 'react'
import { Modal, ModalFooter } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Dropdown } from '@/components/ui/Dropdown'
import { ContactInput } from '@/components/ui/ContactInput'
import { Student, Subject, LessonFormData } from '@/types'
import { LessonFormWithDateTime } from '@/components/lessons/LessonFormWithDateTime'
import { LessonFormModal } from '@/components/lessons/LessonFormModal'
import { ContactType } from '@/lib/contactUtils'
import styles from '../../app/(dashboard)/students/[id]/page.module.scss'
import { stringToColor } from '@/lib/utils'
import { useMediaQuery } from '@/hooks/useMediaQuery'

interface StudentModalsProps {
    student: Student
    allSubjects: Subject[]
    isSubmitting: boolean


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


    isAddSubjectModalOpen: boolean
    onCloseAddSubjectModal: () => void
    onSubmitAddSubject: () => void
    selectedSubjectId: string
    setSelectedSubjectId: (id: string) => void
    onCreateSubjectForLink: (name: string) => void


    isCreateLessonModalOpen: boolean
    onCloseCreateLessonModal: () => void
    onSubmitCreateLesson: () => void
    lessonFormData: LessonFormData
    setLessonFormData: (data: any) => void
    onCreateSubject: (name: string) => void

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
    const isMobile = useMediaQuery("(max-width: 768px)");
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
                title={<>
                    Добавить предмет для {isMobile ? <br /> : ""}
                    <span style={{ color: stringToColor(student.name) }}>{student.name}</span>
                </>}
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
            <LessonFormModal
                isOpen={isCreateLessonModalOpen}
                onClose={onCloseCreateLessonModal}
                isEdit={false}
                formData={lessonFormData}
                setFormData={setLessonFormData}
                students={[student]}
                subjects={allSubjects}
                isSubmitting={isSubmitting}
                error=""
                onSubmit={onSubmitCreateLesson}
                onStudentChange={() => { }}
                onCreateStudent={() => { }}
                onCreateSubject={onCreateSubject}
                handleChange={(name, value) => setLessonFormData((prev: any) => ({ ...prev, [name]: value }))}
                fixedStudentId={student.id}
                customTitle={
                    <>
                        Занятие для ученика {isMobile ? <br /> : ""}
                        <span style={{ color: stringToColor(student.name) }}>{student.name}</span>
                    </>
                }
            />

            {/* Edit Lesson Modal */}
            <LessonFormModal
                isOpen={isEditLessonModalOpen}
                onClose={onCloseEditLessonModal}
                isEdit={true}
                formData={lessonFormData}
                setFormData={setLessonFormData}
                students={[student]}
                subjects={allSubjects}
                isSubmitting={isSubmitting}
                error=""
                onSubmit={onSubmitEditLesson}
                onStudentChange={() => { }}
                onCreateStudent={() => { }}
                onCreateSubject={onCreateSubject}
                handleChange={(name, value) => setLessonFormData((prev: any) => ({ ...prev, [name]: value }))}
                fixedStudentId={student.id}
            />
        </>
    )
}
