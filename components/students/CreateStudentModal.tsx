import React from 'react'
import { Modal, ModalFooter } from '@/components/ui/Modal'
import { Input, Textarea } from '@/components/ui/Input'
import { Dropdown } from '@/components/ui/Dropdown'
import { Subject } from '@/types'
import styles from '../../app/(dashboard)/students/page.module.scss'

interface CreateStudentModalProps {
    isOpen: boolean
    onClose: () => void
    onSubmit: () => void
    isSubmitting: boolean
    error: string
    formData: {
        name: string
        contact: string
        note: string
        subjectId: string
        subjectName: string
    }
    setFormData: (data: any) => void
    handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
    subjects: Subject[]
    onCreateSubject: (name: string) => void
}

export function CreateStudentModal({
    isOpen,
    onClose,
    onSubmit,
    isSubmitting,
    error,
    formData,
    setFormData,
    handleChange,
    subjects,
    onCreateSubject
}: CreateStudentModalProps) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Добавить ученика"
            footer={
                <ModalFooter
                    onCancel={onClose}
                    onSubmit={onSubmit}
                    isLoading={isSubmitting}
                    submitText="Добавить"
                />
            }
        >
            <div className={styles.modalContent}>
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
                        placeholder="Выберите или создайте предмет"
                        value={formData.subjectId}
                        onChange={(value) => {
                            const subject = subjects.find(s => s.id === value)
                            setFormData((prev: any) => ({
                                ...prev,
                                subjectId: value,
                                subjectName: subject ? subject.name : ''
                            }))
                        }}
                        options={subjects.map(s => ({ value: s.id, label: s.name }))}
                        searchable
                        creatable
                        onCreate={onCreateSubject}
                        menuPosition="relative"
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
    )
}
