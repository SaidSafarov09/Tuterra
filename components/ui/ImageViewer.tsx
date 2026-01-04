'use client'

import React, { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import styles from './ImageViewer.module.scss'

interface ImageViewerProps {
    src: string
    onClose: () => void
}

export const ImageViewer: React.FC<ImageViewerProps> = ({ src, onClose }) => {
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
        }
        window.addEventListener('keydown', handleEsc)

        const scrollY = window.scrollY;
        document.body.style.position = 'fixed';
        document.body.style.top = `-${scrollY}px`;
        document.body.style.left = '0';
        document.body.style.right = '0';
        document.body.style.overflow = 'hidden';

        return () => {
            window.removeEventListener('keydown', handleEsc)
            document.body.style.position = '';
            document.body.style.top = '';
            document.body.style.left = '';
            document.body.style.right = '';
            document.body.style.overflow = '';
            window.scrollTo(0, scrollY);
        }
    }, [onClose])

    const content = (
        <div className={styles.overlay} onClick={onClose}>
            <button className={styles.closeButton} onClick={onClose}>
                <X size={24} />
            </button>
            <div className={styles.imageWrapper} onClick={(e) => e.stopPropagation()}>
                <img src={src} alt="Avatar full size" />
            </div>
        </div>
    )

    if (typeof document === 'undefined') return null;
    return createPortal(content, document.body)
}
