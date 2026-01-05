'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Gift, X, Check } from 'lucide-react'
import confetti from 'canvas-confetti'
import styles from './ReferralBonusModal.module.scss'
import { notificationsApi } from '@/services/api'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { Button } from '../ui/Button'

interface ReferralBonusModalProps {
    notificationId: string
    inviteeName: string
    onClose: () => void
}

export const ReferralBonusModal: React.FC<ReferralBonusModalProps> = ({
    notificationId,
    inviteeName,
    onClose
}) => {
    const [isVisible, setIsVisible] = useState(true)
    const isMobile = useMediaQuery('(max-width: 768px)')
    useEffect(() => {
        if (isVisible) {
            // Launch confetti!
            const duration = 3 * 1000
            const animationEnd = Date.now() + duration
            const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 10000 }

            const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min

            const interval: any = setInterval(function () {
                const timeLeft = animationEnd - Date.now()

                if (timeLeft <= 0) {
                    return clearInterval(interval)
                }

                const particleCount = 50 * (timeLeft / duration)

                // since particles fall down, start a bit higher than random
                confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } })
                confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } })
            }, 250)

            return () => clearInterval(interval)
        }
    }, [isVisible])

    const handleClose = async () => {
        try {
            // Mark notification as read when closed
            await notificationsApi.markAsRead(notificationId)
        } catch (error) {
            console.error('Failed to mark referral notification as read:', error)
        }
        setIsVisible(false)
        setTimeout(onClose, 300)
    }

    return (
        <AnimatePresence>
            {isVisible && (
                <div className={styles.overlay}>
                    <motion.div
                        className={styles.modal}
                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    >
                        <div className={styles.content}>
                            <div className={styles.giftIconWrapper}>
                                <Gift size={isMobile ? 30 : 40} />
                            </div>

                            <h2 className={styles.title}>Поздравляем! 🎉</h2>

                            <p className={styles.description}>
                                Ваш коллега <strong>{inviteeName}</strong> активно использует Tuterra.
                                Вам начислено <strong>30 дней PRO</strong> в подарок!
                            </p>

                            <div className={styles.bonusCard}>
                                <span className={styles.bonusValue}>+30 дней</span>
                                <span className={styles.bonusLabel}>PRO-подписка активна</span>
                            </div>

                            <div className={styles.actions}>
                                <Button
                                    className={`${styles.button} ${styles.primaryBtn}`}
                                    onClick={handleClose}
                                >
                                    Супер, спасибо!
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
