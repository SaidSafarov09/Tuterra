'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { Send, X, ArrowRight, Star } from 'lucide-react'
import styles from './PromotionalBanner.module.scss'

interface PromotionalBannerProps {
    title: string
    description: string
    buttonText: string
    onAction: () => void
    onClose: () => void
    icon?: React.ReactNode
    variant?: 'telegram' | 'referral' | 'premium'
}

export const PromotionalBanner: React.FC<PromotionalBannerProps> = ({
    title,
    description,
    buttonText,
    onAction,
    onClose,
    icon,
    variant = 'telegram'
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`${styles.banner} ${styles[variant]}`}
        >
            <div className={styles.iconWrapper}>
                {icon || (variant === 'telegram' ? <Send size={24} /> : <Star size={24} />)}
            </div>

            <div className={styles.content}>
                <h3 className={styles.title}>{title}</h3>
                <p className={styles.description}>{description}</p>
            </div>

            <div className={styles.actions}>
                <Button
                    size="small"
                    onClick={onAction}
                    className={styles.actionBtn}
                >
                    {buttonText} <ArrowRight size={16} style={{ marginLeft: '8px' }} />
                </Button>
                <button onClick={onClose} className={styles.closeBtn} aria-label="Закрыть">
                    <X size={20} />
                </button>
            </div>

            {/* Decorative background elements */}
            <div className={styles.decoration} />
        </motion.div>
    )
}
