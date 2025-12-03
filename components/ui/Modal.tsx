import React, { useEffect, useRef, useState } from 'react'
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
    const [showTopGradient, setShowTopGradient] = useState(false)
    const [showBottomGradient, setShowBottomGradient] = useState(true) // Start with true for testing

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

    useEffect(() => {
        const handleScroll = () => {
            if (!modalRef.current) {
                return
            }

            const { scrollTop, scrollHeight, clientHeight } = modalRef.current

            const hasScroll = scrollHeight > clientHeight
            const shouldShowTop = hasScroll && scrollTop > 10
            const shouldShowBottom = hasScroll && (scrollTop + clientHeight < scrollHeight - 10)


            // Show top gradient if scrolled down
            setShowTopGradient(shouldShowTop)

            // Show bottom gradient if not at bottom
            setShowBottomGradient(shouldShowBottom)
        }

        const modalElement = modalRef.current
        if (modalElement && isOpen) {
            handleScroll()
            setTimeout(() => {
                handleScroll()
            }, 100)

            modalElement.addEventListener('scroll', handleScroll)
            window.addEventListener('resize', handleScroll)

            return () => {
                modalElement.removeEventListener('scroll', handleScroll)
                window.removeEventListener('resize', handleScroll)
            }
        }
    }, [isOpen])

    if (!isOpen) return null

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div
                ref={modalRef}
                className={`${styles.modal} ${size === 'large' ? styles.modalLarge : ''}`}
                onClick={(e) => e.stopPropagation()}
            >
                {showTopGradient && <div className={styles.gradientTop} />}

                <div className={styles.header}>
                    <h2 className={styles.title}>{title}</h2>
                    <div className={styles.closeButton} onClick={onClose}>
                        <XIcon size={24} />
                    </div>
                </div>
                <div className={styles.content}>{children}</div>
                {footer && <div className={styles.footer}>{footer}</div>}

                {showBottomGradient && <div className={styles.gradientBottom} />}
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
