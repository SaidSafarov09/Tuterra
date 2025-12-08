'use client'

import React from 'react'
import { Modal, ModalFooter } from '@/components/ui/Modal'
import { StudentForm, StudentFormProps } from './StudentForm'
import styles from '@/app/(dashboard)/students/page.module.scss'

interface CreateStudentModalProps extends StudentFormProps {
    isOpen: boolean
    onClose: () => void
    onSubmit: () => void
}

export function CreateStudentModal({
    isOpen,
    onClose,
    onSubmit,
    isSubmitting,
    ...formProps
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
                <StudentForm
                    isSubmitting={isSubmitting}
                    {...formProps}
                />
            </div>
        </Modal>
    )
}
