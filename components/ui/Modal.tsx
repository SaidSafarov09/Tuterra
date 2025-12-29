import React, { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import styles from './Modal.module.scss'
import { Button } from './Button'
import { XIcon, ArrowLeft } from 'lucide-react'
import { useMediaQuery } from '@/hooks/useMediaQuery'

interface ModalProps {
    isOpen: boolean
    onClose: () => void
    title: string | React.ReactNode
    children: React.ReactNode
    footer?: React.ReactNode
    size?: 'default' | 'large'
    maxWidth?: string
    minHeight?: string
    mobileView?: 'page' | 'modal'
    withHeader?: boolean
    padding?: string
}

export const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    title,
    children,
    footer,
    size = 'default',
    maxWidth = '500px',
    minHeight = "auto",
    mobileView = 'page',
    withHeader = true,
    padding,
}) => {
    const modalRef = useRef<HTMLDivElement>(null)

    const isMobile = useMediaQuery("(max-width: 768px)")
    useEffect(() => {
        if (!isOpen) return

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose()
            }
        }

        document.addEventListener('keydown', handleEscape)

        return () => {
            document.removeEventListener('keydown', handleEscape)
            if (document.querySelectorAll('.modal-overlay').length <= 1) {
                document.body.style.overflow = 'unset'
                document.documentElement.style.overflow = 'unset'
            }
        }
    }, [isOpen, onClose])

    useEffect(() => {
        if (!isOpen) return;

        const scrollY = window.scrollY;
        document.body.style.position = 'fixed';
        document.body.style.top = `-${scrollY}px`;
        document.body.style.left = '0';
        document.body.style.right = '0';
        document.body.style.overflow = 'hidden';

        return () => {
            document.body.style.position = '';
            document.body.style.top = '';
            document.body.style.left = '';
            document.body.style.right = '';
            document.body.style.overflow = '';

            window.scrollTo(0, scrollY);
        };
    }, [isOpen]);

    if (!isOpen) return null

    const modalContent = (
        <div className={`${styles.overlay} modal-overlay`} onClick={onClose}>
            <div
                ref={modalRef}
                className={`${styles.modal} ${size === 'large' ? styles.modalLarge : ''} ${mobileView === 'modal' ? styles.modalPopup : ''}`}
                onClick={(e) => e.stopPropagation()}
                style={{ maxWidth: isMobile ? "100%" : maxWidth }}
            >
                {withHeader && (

                    <div className={styles.header}>
                        {mobileView === 'page' && (
                            <div className={styles.mobileBackButton} onClick={onClose}>
                                <ArrowLeft size={20} />
                            </div>
                        )}
                        <h2 className={styles.title}>{title}</h2>
                        <div className={`${styles.closeButton} ${mobileView === 'modal' ? styles.closeButtonPopup : ''}`} onClick={onClose}>
                            <XIcon size={24} />
                        </div>
                    </div>
                )}
                <div style={{ minHeight, padding }} className={styles.content}>{children}</div>
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
    // Определяем текст загрузки на основе submitText
    const loadingText = submitText === 'Удалить' ? 'Удаление...' :
        submitText === 'Сохранить' ? 'Сохранение...' :
            `${submitText}...`

    return (
        <>
            <Button variant="secondary" onClick={onCancel} disabled={isLoading}>
                {cancelText}
            </Button>
            <Button variant={variant} onClick={onSubmit} isLoading={isLoading} disabled={isLoading}>
                {isLoading ? loadingText : submitText}
            </Button>
        </>
    )
}
