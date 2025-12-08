'use client'

import React from 'react'
import { Modal, ModalFooter } from '@/components/ui/Modal'
import { LessonForm, LessonFormProps } from './LessonForm'

interface LessonFormModalProps extends LessonFormProps {
    isOpen: boolean
    onClose: () => void
    customTitle?: string
}

export function LessonFormModal({
    isOpen,
    onClose,
    customTitle,
    isEdit,
    onSubmit,
    isSubmitting,
    ...formProps
}: LessonFormModalProps) {
    const title = customTitle || (isEdit ? "Редактировать занятие" : "Добавить занятие")

    return (
        <Modal
            maxWidth="650px"
            minHeight='580px'
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            footer={
                <ModalFooter
                    onCancel={onClose}
                    onSubmit={onSubmit}
                    isLoading={isSubmitting}
                    submitText={isEdit ? "Сохранить" : "Добавить"}
                />
            }
        >
            <LessonForm
                isEdit={isEdit}
                onSubmit={onSubmit}
                isSubmitting={isSubmitting}
                {...formProps}
            />
        </Modal>
    )
}
