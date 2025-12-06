'use client'

import React, { useEffect } from 'react'
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
        return () => window.removeEventListener('keydown', handleEsc)
    }, [onClose])

    return (
        <div className={styles.overlay} onClick={onClose}>
            <button className={styles.closeButton} onClick={onClose}>
                <X size={24} />
            </button>
            <div className={styles.imageWrapper} onClick={(e) => e.stopPropagation()}>
                <img src={src} alt="Avatar full size" />
            </div>
        </div>
    )
}
