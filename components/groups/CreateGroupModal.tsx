'use client'

import React from 'react'
import { Modal, ModalFooter } from '@/components/ui/Modal'
import { GroupForm, GroupFormProps } from './GroupForm'
import styles from '@/app/(dashboard)/groups/page.module.scss'

interface CreateGroupModalProps extends GroupFormProps {
    isOpen: boolean
    onClose: () => void
    onSubmit: () => void
    isEdit?: boolean
}

export function CreateGroupModal({
    isOpen,
    onClose,
    onSubmit,
    isSubmitting,
    isEdit = false,
    ...formProps
}: CreateGroupModalProps) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEdit ? "Редактировать группу" : "Создать группу"}
            footer={
                <ModalFooter
                    onCancel={onClose}
                    onSubmit={onSubmit}
                    isLoading={isSubmitting}
                    submitText={isEdit ? "Сохранить" : "Создать"}
                />
            }
        >
            <div className={styles.modalContent}>
                <GroupForm
                    isSubmitting={isSubmitting}
                    {...formProps}
                />
            </div>
        </Modal>
    )
}
