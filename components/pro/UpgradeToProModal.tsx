'use client'

import React from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Crown, Users, BookOpen, BarChart3, Calendar, Zap, CheckCircle2 } from 'lucide-react'
import styles from './UpgradeToProModal.module.scss'
import { LimitType, LIMIT_MESSAGES } from '@/lib/limits'

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
                            <p className={styles.priceNote}>Первые 14 дней бесплатно</p>
                        </div>
                    </div>
                </div>

                <div className={styles.actions}>
                    <Button
                        onClick={() => {
                            alert('Переход на страницу оплаты (в разработке)')
                            onClose()
                        }}
                        className={styles.upgradeButton}
                        fullWidth
                        size="large"
                    >
                        <Crown size={20} />
                        Попробовать Pro бесплатно
                    </Button>
                    <button onClick={onClose} className={styles.closeButton}>
                        Может быть позже
                    </button>
                </div>
            </div>
        </Modal>
    )
}
