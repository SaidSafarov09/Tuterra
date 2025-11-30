import React from 'react'
import { Modal, ModalFooter } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Dropdown } from '@/components/ui/Dropdown'
import { DateTimePicker } from '@/components/ui/DateTimePicker'
import { Student, Subject } from '@/types'
import styles from '../../app/(dashboard)/students/[id]/page.module.scss'

interface StudentModalsProps {
    student: Student
    allSubjects: Subject[]
    isSubmitting: boolean

    // Edit Modal
    isEditModalOpen: boolean
    onCloseEditModal: () => void
    onSubmitEdit: () => void
    editFormData: { name: string; contact: string; note: string }
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
    lessonFormData: { subjectId: string; date: Date; price: string; isPaid: boolean }
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
                    <Input
                        label="Контакт"
                        value={editFormData.contact}
                        onChange={(e) => setEditFormData({ ...editFormData, contact: e.target.value })}
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
                    <Dropdown
                        label="Предмет"
                        placeholder="Выберите или создайте предмет"
                        value={lessonFormData.subjectId}
                        onChange={(value) => setLessonFormData({ ...lessonFormData, subjectId: value })}
                        options={allSubjects.map(s => ({ value: s.id, label: s.name }))}
                        searchable
                        creatable
                        onCreate={onCreateSubject}
                        menuPosition="relative"
                    />

                    <DateTimePicker
                        label="Дата и время"
                        value={lessonFormData.date}
                        onChange={(date) => setLessonFormData({ ...lessonFormData, date: date || new Date() })}
                        showTime
                        required
                        dropDirection="center"
                    />
                    <Input
                        label="Стоимость"
                        type="number"
                        value={lessonFormData.price}
                        onChange={(e) => setLessonFormData({ ...lessonFormData, price: e.target.value })}
                        required
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                            type="checkbox"
                            id="isPaid"
                            checked={lessonFormData.isPaid}
                            onChange={(e) => setLessonFormData({ ...lessonFormData, isPaid: e.target.checked })}
                            style={{ width: '16px', height: '16px' }}
                        />
                        <label htmlFor="isPaid">Оплачено</label>
                    </div>
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
                    <Dropdown
                        label="Предмет"
                        placeholder="Выберите или создайте предмет"
                        value={lessonFormData.subjectId}
                        onChange={(value) => setLessonFormData({ ...lessonFormData, subjectId: value })}
                        options={allSubjects.map(s => ({ value: s.id, label: s.name }))}
                        searchable
                        creatable
                        onCreate={onCreateSubject}
                        menuPosition="relative"
                    />

                    <DateTimePicker
                        label="Дата и время"
                        value={lessonFormData.date}
                        onChange={(date) => setLessonFormData({ ...lessonFormData, date: date || new Date() })}
                        showTime
                        required
                        dropDirection="center"
                    />
                    <Input
                        label="Стоимость"
                        type="number"
                        value={lessonFormData.price}
                        onChange={(e) => setLessonFormData({ ...lessonFormData, price: e.target.value })}
                        required
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                            type="checkbox"
                            id="isPaidEdit"
                            checked={lessonFormData.isPaid}
                            onChange={(e) => setLessonFormData({ ...lessonFormData, isPaid: e.target.checked })}
                            style={{ width: '16px', height: '16px' }}
                        />
                        <label htmlFor="isPaidEdit">Оплачено</label>
                    </div>
                </form>
            </Modal>
        </>
    )
}
