'use client'

import React from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Crown, CheckCircle2, Calendar } from 'lucide-react'
import styles from './PaymentSuccessModal.module.scss'
import { format, addDays } from 'date-fns'
import { ru } from 'date-fns/locale'

interface PaymentSuccessModalProps {
    isOpen: boolean
    onClose: () => void
    proExpiresAt?: Date | null
}

export const PaymentSuccessModal: React.FC<PaymentSuccessModalProps> = ({
    isOpen,
    onClose,
    proExpiresAt
}) => {
    // Если дата не передана, вычисляем через 30 дней
    const expiryDate = proExpiresAt || addDays(new Date(), 30)
    const formattedDate = format(expiryDate, 'd MMMM yyyy', { locale: ru })

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title=""
            withHeader={false}
            maxWidth="550px"
            padding="0"
        >
            <div className={styles.modal}>
                <div className={styles.header}>
                    <div className={styles.iconWrapper}>
                        <CheckCircle2 size={64} className={styles.checkIcon} />
                        <Crown size={32} className={styles.crownIcon} />
                    </div>
                    <h2 className={styles.title}>Оплата прошла успешно!</h2>
                    <p className={styles.subtitle}>
                        Поздравляем! Теперь у вас есть доступ ко всем возможностям Tuterra PRO
                    </p>
                </div>

                <div className={styles.content}>
                    <div className={styles.infoCard}>
                        <div className={styles.infoIcon}>
                            <Calendar size={24} />
                        </div>
                        <div className={styles.infoText}>
                            <div className={styles.infoLabel}>Подписка активна до</div>
                            <div className={styles.infoValue}>{formattedDate}</div>
                        </div>
                    </div>

                    <div className={styles.features}>
                        <p className={styles.featuresTitle}>Теперь вам доступно:</p>
                        <ul className={styles.featuresList}>
                            <li>
                                <CheckCircle2 size={18} />
                                <span>Безлимитное количество учеников и групп</span>
                            </li>
                            <li>
                                <CheckCircle2 size={18} />
                                <span>Планы обучения для всех учеников</span>
                            </li>
                            <li>
                                <CheckCircle2 size={18} />
                                <span>Расширенная аналитика доходов</span>
                            </li>
                            <li>
                                <CheckCircle2 size={18} />
                                <span>Неограниченные планы обучения для учеников </span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className={styles.actions}>
                    <Button
                        onClick={onClose}
                        className={styles.continueButton}
                        fullWidth
                        size="large"
                    >
                        Начать пользоваться
                    </Button>
                </div>
            </div>
        </Modal>
    )
}
