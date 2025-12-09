'use client'

import React from 'react'
import { Modal, ModalFooter } from '@/components/ui/Modal'
import { LessonForm, LessonFormProps } from './LessonForm'
import { useMediaQuery } from '@/hooks/useMediaQuery'

interface LessonFormModalProps extends LessonFormProps {
    isOpen: boolean
    onClose: () => void
    customTitle?: string | React.ReactNode
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
    const isMobile = useMediaQuery("(max-width: 768px)")
    const minHeight = isMobile ? "auto" : "550px"

    return (
        <Modal
            maxWidth={isMobile ? "100%" : "650px"}
            minHeight={isEdit ? "auto" : minHeight}
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
