import React, { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import styles from './Modal.module.scss'
import { Button } from './Button'
import { XIcon } from 'lucide-react'

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
    const modalRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!isOpen) return

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose()
            }
        }

        document.addEventListener('keydown', handleEscape)
        document.body.style.overflow = 'hidden'

        return () => {
            document.removeEventListener('keydown', handleEscape)
            document.body.style.overflow = 'unset'
        }
    }, [isOpen, onClose])

    if (!isOpen) return null

    const modalContent = (
        <div className={styles.overlay} onClick={onClose}>
            <div
                ref={modalRef}
                className={`${styles.modal} ${size === 'large' ? styles.modalLarge : ''}`}
                onClick={(e) => e.stopPropagation()}
            >

                <div className={styles.header}>
                    <h2 className={styles.title}>{title}</h2>
                    <div className={styles.closeButton} onClick={onClose}>
                        <XIcon size={24} />
                    </div>
                </div>
                <div className={styles.content}>{children}</div>
                {footer && <div className={styles.footer}>{footer}</div>}
            </div>
        </div>
    )

    
    if (typeof document !== 'undefined') {
        return createPortal(modalContent, document.body)
    }

    return null
}

interface ModalFooterProps {
    onCancel: () => void
    onSubmit: () => void
    isLoading?: boolean
    submitText?: string
    cancelText?: string
    variant?: 'primary' | 'secondary' | 'danger'
}

export const ModalFooter: React.FC<ModalFooterProps> = ({
    onCancel,
    onSubmit,
    isLoading = false,
    submitText = 'Сохранить',
    cancelText = 'Отмена',
    variant = 'primary',
}) => {
    return (
        <>
            <Button variant="secondary" onClick={onCancel} disabled={isLoading}>
                {cancelText}
            </Button>
            <Button variant={variant} onClick={onSubmit} disabled={isLoading}>
                {isLoading ? 'Сохранение...' : submitText}
            </Button>
        </>
    )
}
