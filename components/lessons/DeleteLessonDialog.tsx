'use client'

import React, { useState } from 'react'
import { Modal, ModalFooter } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import styles from './DeleteLessonDialog.module.scss'

interface DeleteLessonDialogProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: (scope: 'single' | 'series') => void
    isSeries: boolean
    isLoading?: boolean
}

export const DeleteLessonDialog: React.FC<DeleteLessonDialogProps> = ({
    isOpen,
    onClose,
    onConfirm,
    isSeries,
    isLoading = false
}) => {
    const [scope, setScope] = useState<'single' | 'series'>('single')

    const handleSubmit = () => {
        onConfirm(scope)
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Удалить занятие"
            mobileView="modal"
            footer={
                <ModalFooter
                    onCancel={onClose}
                    onSubmit={handleSubmit}
                    isLoading={isLoading}
                    submitText="Удалить"
                    variant="danger"
                />
            }
        >
            <div className={styles.content}>
                <p className={styles.message}>
                    Вы уверены, что хотите удалить это занятие? Это действие нельзя отменить.
                </p>

                {isSeries && (
                    <div className={styles.options}>
                        <label className={styles.option}>
                            <input
                                type="radio"
                                name="deleteScope"
                                value="single"
                                checked={scope === 'single'}
                                onChange={() => setScope('single')}
                            />
                            <span>Удалить только это занятие</span>
                        </label>

                        <label className={styles.option}>
                            <input
                                type="radio"
                                name="deleteScope"
                                value="series"
                                checked={scope === 'series'}
                                onChange={() => setScope('series')}
                            />
                            <span>Удалить всю серию повторений</span>
                        </label>
                    </div>
                )}
            </div>
        </Modal>
    )
}
