'use client'

import React, { useState, useEffect } from 'react'
import { Modal, ModalFooter } from '@/components/ui/Modal'
import { Checkbox } from '@/components/ui/Checkbox'
import styles from './GroupPaymentModal.module.scss'

interface GroupPaymentModalProps {
    isOpen: boolean
    onClose: () => void
    onSubmit: (paidStudentIds: string[]) => void
    students: { id: string; name: string }[]
    initialPaidStudentIds: string[]
    isSubmitting: boolean
}

export function GroupPaymentModal({
    isOpen,
    onClose,
    onSubmit,
    students,
    initialPaidStudentIds,
    isSubmitting
}: GroupPaymentModalProps) {
    const [paidStudentIds, setPaidStudentIds] = useState<string[]>(initialPaidStudentIds)

    useEffect(() => {
        if (isOpen) {
            setPaidStudentIds(initialPaidStudentIds)
        }
    }, [isOpen, initialPaidStudentIds])

    const handleToggle = (studentId: string) => {
        setPaidStudentIds(prev =>
            prev.includes(studentId)
                ? prev.filter(id => id !== studentId)
                : [...prev, studentId]
        )
    }

    const handleSubmit = () => {
        onSubmit(paidStudentIds)
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Управление оплатой"
            footer={
                <ModalFooter
                    onCancel={onClose}
                    onSubmit={handleSubmit}
                    isLoading={isSubmitting}
                    submitText={isSubmitting ? 'Сохранение...' : 'Сохранить'}
                />
            }
        >
            <div className={styles.content}>
                <p className={styles.description}>
                    Отметьте учеников, которые оплатили занятие:
                </p>
                <div className={styles.studentsList}>
                    {students.map(student => (
                        <Checkbox
                            key={student.id}
                            checked={paidStudentIds.includes(student.id)}
                            onChange={() => handleToggle(student.id)}
                            label={student.name}
                            disabled={isSubmitting}
                        />
                    ))}
                </div>
            </div>
        </Modal>
    )
}
