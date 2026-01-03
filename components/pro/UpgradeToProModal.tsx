'use client'

import React, { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Crown, Users, BookOpen, BarChart3, Calendar, Zap, CheckCircle2 } from 'lucide-react'
import styles from './UpgradeToProModal.module.scss'
import { LimitType, LIMIT_MESSAGES } from '@/lib/limits'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/auth'

interface UpgradeToProModalProps {
    isOpen: boolean
    onClose: () => void
    limitType: LimitType
    defaultPlan?: 'month' | 'year'
}

const PRO_FEATURES = [
    { icon: Users, text: 'Безлимитное количество учеников' },
    { icon: BookOpen, text: 'Неограниченное число групп' },
    { icon: Calendar, text: 'Планы обучения для всех учеников и групп' },
    { icon: BarChart3, text: 'Расширенная аналитика доходов' },
    { icon: Zap, text: 'Автоматизация напоминаний' },
    { icon: CheckCircle2, text: 'Приоритетная поддержка' }
]

const PLANS = {
    month: {
        id: 'month',
        price: 490,
        oldPrice: null,
        savings: null,
        label: 'Месяц',
        note: 'Оплата раз в месяц'
    },
    year: {
        id: 'year',
        price: 3990,
        oldPrice: 5880,
        savings: 'Выгода 32%',
        label: 'Год',
        note: '332 ₽ / мес'
    }
}

export const UpgradeToProModal: React.FC<UpgradeToProModalProps> = ({
    isOpen,
    onClose,
    limitType,
    defaultPlan = 'year'
}) => {
    const { user } = useAuthStore()
    const message = LIMIT_MESSAGES[limitType]
    const [isLoading, setIsLoading] = useState(false)
    const [selectedPlan, setSelectedPlan] = useState<'month' | 'year'>(defaultPlan)

    // Sync state with props when modal opens or prop changes
    React.useEffect(() => {
        if (isOpen) {
            setSelectedPlan(defaultPlan)
        }
    }, [isOpen, defaultPlan])

    // Строжайшая проверка: ученикам запрещено видеть это окно
    if (user?.role !== 'teacher') {
        return null
    }

    const handleUpgrade = async () => {
        try {
            setIsLoading(true)

            const response = await fetch('/api/payments/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    planId: selectedPlan
                })
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Failed to create payment')
            }

            const data = await response.json()

            if (data.confirmationUrl) {
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
                    <div className={styles.plans}>
                        {(Object.values(PLANS)).map((plan) => (
                            <div
                                key={plan.id}
                                className={`${styles.planCard} ${selectedPlan === plan.id ? styles.planCardActive : ''}`}
                                onClick={() => setSelectedPlan(plan.id as 'month' | 'year')}
                            >
                                {plan.savings && <div className={styles.savingsBadge}>{plan.savings}</div>}
                                <div className={styles.planLabel}>{plan.id === 'year' ? 'Выгодный' : 'Базовый'}</div>
                                <div className={styles.planPeriod}>{plan.label}</div>
                                <div className={styles.planPrice}>
                                    <span className={styles.amount}>{plan.price} ₽</span>
                                    {plan.oldPrice && <span className={styles.oldPrice}>{plan.oldPrice} ₽</span>}
                                </div>
                                <div className={styles.planNote}>{plan.note}</div>
                                <div className={styles.radio}>
                                    <div className={`${styles.radioCircle} ${selectedPlan === plan.id ? styles.radioCircleActive : ''}`} />
                                </div>
                            </div>
                        ))}
                    </div>

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
                </div>

                <div className={styles.actions}>
                    <Button
                        onClick={handleUpgrade}
                        className={styles.upgradeButton}
                        fullWidth
                        size="large"
                        disabled={isLoading}
                    >
                        <Zap size={20} fill="currentColor" />
                        {isLoading ? 'Загрузка...' : `Оплатить ${PLANS[selectedPlan].price} ₽`}
                    </Button>
                    <button onClick={onClose} className={styles.closeButton} disabled={isLoading}>
                        Может быть позже
                    </button>
                </div>
            </div>
        </Modal>
    )
}
