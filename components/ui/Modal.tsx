import React, { useEffect } from 'react'
import styles from './Modal.module.scss'
import { Button } from './Button'

interface ModalProps {
    isOpen: boolean
    onClose: () => void
    title: string
    children: React.ReactNode
    footer?: React.ReactNode
    size?: 'default' | 'large'
}

export const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    title,
    children,
    footer,
    size = 'default',
}) => {
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose()
            }
        }

        if (isOpen) {
            document.addEventListener('keydown', handleEscape)
            document.body.style.overflow = 'hidden'
        }

        return () => {
            document.removeEventListener('keydown', handleEscape)
            document.body.style.overflow = 'unset'
        }
    }, [isOpen, onClose])

    if (!isOpen) return null

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={`${styles.modal} ${size === 'large' ? styles.modalLarge : ''}`} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <h2 className={styles.title}>{title}</h2>
                </div>
                <div className={styles.content}>{children}</div>
                {footer && <div className={styles.footer}>{footer}</div>}
            </div>
        </div>
    )
}

interface ModalFooterProps {
    onCancel: () => void
    onSubmit: () => void
    isLoading?: boolean
    submitText?: string
    cancelText?: string
}

export const ModalFooter: React.FC<ModalFooterProps> = ({
    onCancel,
    onSubmit,
    isLoading = false,
    submitText = 'Сохранить',
    cancelText = 'Отмена',
}) => {
    return (
        <>
            <Button variant="secondary" onClick={onCancel} disabled={isLoading}>
                {cancelText}
            </Button>
            <Button onClick={onSubmit} disabled={isLoading}>
                {isLoading ? 'Сохранение...' : submitText}
            </Button>
        </>
    )
}
