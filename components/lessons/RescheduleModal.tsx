'use client'

import React, { useState, useEffect } from 'react'
import { Modal, ModalFooter } from '@/components/ui/Modal'
import { CustomDateTimePicker } from '@/components/ui/CustomDateTimePicker'
import styles from './RescheduleModal.module.scss'

interface RescheduleModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: (newDate: Date) => void
    currentDate: Date
    isSubmitting?: boolean
}

export const RescheduleModal: React.FC<RescheduleModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    currentDate,
    isSubmitting = false
}) => {
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(currentDate)

    useEffect(() => {
        if (isOpen) {
            setSelectedDate(currentDate)
        }
    }, [isOpen, currentDate])

    const handleConfirm = () => {
        if (selectedDate) {
            onConfirm(selectedDate)
        }
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Перенести занятие"
            footer={
                <ModalFooter
                    onCancel={onClose}
                    onSubmit={handleConfirm}
                    submitText="Перенести"
                    cancelText="Отмена"
                    isLoading={isSubmitting}
                />
            }
        >
            <div className={styles.content}>
                <CustomDateTimePicker
                    value={selectedDate}
                    onChange={setSelectedDate}
                />
            </div>
        </Modal>
    )
}
