import React from 'react'
import { Modal } from './Modal'
import { Button } from './Button'
import styles from './ConfirmDialog.module.scss'

interface ConfirmDialogProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
    title: string
    message: string
    confirmText?: string
    cancelText?: string
    variant?: 'danger' | 'warning' | 'info'
    isLoading?: boolean
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Подтвердить',
    cancelText = 'Отмена',
    variant = 'danger',
    isLoading = false,
}) => {
    const handleConfirm = () => {
        onConfirm()
        if (!isLoading) {
            onClose()
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} mobileView="modal">
            <div className={styles.content}>
                <p className={styles.message}>{message}</p>
                <div className={styles.actions}>
                    <Button
                        variant="secondary"
                        onClick={onClose}
                        disabled={isLoading}
                    >
                        {cancelText}
                    </Button>
                    <Button
                        variant={variant === 'danger' ? 'primary' : 'primary'}
                        onClick={handleConfirm}
                        disabled={isLoading}
                        className={variant === 'danger' ? styles.dangerButton : ''}
                    >
                        {isLoading ? 'Загрузка...' : confirmText}
                    </Button>
                </div>
            </div>
        </Modal>
    )
}
