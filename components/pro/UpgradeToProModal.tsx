'use client'

import React, { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Crown, Users, BookOpen, BarChart3, Calendar, Zap, CheckCircle2 } from 'lucide-react'
import styles from './UpgradeToProModal.module.scss'
import { LimitType, LIMIT_MESSAGES } from '@/lib/limits'
import { toast } from 'sonner'

interface UpgradeToProModalProps {
    isOpen: boolean
    onClose: () => void
    limitType: LimitType
}

const PRO_FEATURES = [
    { icon: Users, text: 'Безлимитное количество учеников' },
    { icon: BookOpen, text: 'Неограниченное число групп' },
    { icon: Calendar, text: 'Планы обучения для всех учеников и групп' },
    { icon: BarChart3, text: 'Расширенная аналитика доходов' },
    { icon: Zap, text: 'Автоматизация напоминаний' },
    { icon: CheckCircle2, text: 'Приоритетная поддержка' }
]

export const UpgradeToProModal: React.FC<UpgradeToProModalProps> = ({
    isOpen,
    onClose,
    limitType
}) => {
    const message = LIMIT_MESSAGES[limitType]
    const [isLoading, setIsLoading] = useState(false)

    const handleUpgrade = async () => {
        try {
            setIsLoading(true)

            const response = await fetch('/api/payments/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Failed to create payment')
            }

            const data = await response.json()

            if (data.confirmationUrl) {
                // Редиректим на страницу оплаты ЮKassa
                window.location.href = data.confirmationUrl
            } else {
                throw new Error('No confirmation URL received')
            }
        } catch (error) {
            console.error('Payment error:', error)
            toast.error(error instanceof Error ? error.message : 'Не удалось создать платеж')
            setIsLoading(false)
        }
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title=""
            withHeader={false}
            maxWidth="650px"
            padding="0"
        >
            <div className={styles.modal}>
                <div className={styles.header}>
                    <div className={styles.badge}>
                        <Crown size={20} />
                        <span>PRO</span>
                    </div>
                    <h2 className={styles.title}>Перейдите на <span>Pro</span><br /> и раскройте весь потенциал</h2>
                    <p className={styles.subtitle}>{message.description}</p>
                </div>

                <div className={styles.content}>
                    <div className={styles.features}>
                        {PRO_FEATURES.map((feature, index) => (
                            <div key={index} className={styles.feature}>
                                <div className={styles.featureIcon}>
                                    <feature.icon size={20} />
                                </div>
                                <span className={styles.featureText}>{feature.text}</span>
                            </div>
                        ))}
                    </div>

                    <div className={styles.pricing}>
                        <div className={styles.priceTag}>
                            <div className={styles.priceAmount}>
                                <span className={styles.currency}>₽</span>
                                <span className={styles.price}>490</span>
                                <span className={styles.period}>/мес</span>
                            </div>
                            <p className={styles.priceNote}>30 дней подписки</p>
                        </div>
                    </div>
                </div>

                <div className={styles.actions}>
                    <Button
                        onClick={handleUpgrade}
                        className={styles.upgradeButton}
                        fullWidth
                        size="large"
                        disabled={isLoading}
                    >
                        <Crown size={20} />
                        {isLoading ? 'Загрузка...' : 'Перейти к оплате'}
                    </Button>
                    <button onClick={onClose} className={styles.closeButton} disabled={isLoading}>
                        Может быть позже
                    </button>
                </div>
            </div>
        </Modal>
    )
}
