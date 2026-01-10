'use client'

import React, { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Crown, Users, BookOpen, BarChart3, Calendar, Zap, CheckCircle2 } from 'lucide-react'
import styles from './UpgradeToProModal.module.scss'
import { LimitType, LIMIT_MESSAGES } from '@/lib/limits'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/auth'
import { formatCurrency } from '@/lib/formatUtils'

import { PartnerPromoInput } from '@/components/ui/PartnerPromoInput'

interface UpgradeToProModalProps {
    isOpen: boolean
    onClose: () => void
    limitType: LimitType
    defaultPlan?: 'month' | 'year'
    customMessage?: string | null
}

const PRO_FEATURES = [
    { icon: Users, text: 'Безлимитное количество учеников' },
    { icon: BookOpen, text: 'Неограниченное число групп' },
    { icon: Calendar, text: 'Планы обучения для всех учеников и групп' },
    { icon: BarChart3, text: 'Расширенная аналитика доходов' },
    { icon: Zap, text: 'Автоматизация напоминаний' },
    { icon: CheckCircle2, text: 'Неограниченные планы обучения для учеников ' }
]

const getPlans = (country?: string | null) => {
    const isKz = country === 'KZ'
    const isBy = country === 'BY'
    const currency = isKz ? '₸' : isBy ? 'BYN' : '₽'

    return {
        currency,
        plans: {
            month: {
                id: 'month',
                price: isKz ? 3200 : isBy ? 18 : 490,
                oldPrice: null,
                savings: null,
                label: 'Месяц',
                note: 'Оплата раз в месяц'
            },
            year: {
                id: 'year',
                price: isKz ? 26000 : isBy ? 147 : 3990,
                oldPrice: isKz ? 38000 : isBy ? 217 : 5880,
                savings: 'Выгода 32%',
                label: 'Год',
                note: isKz ? '2166 / мес' : isBy ? '12 / мес' : '332 / мес'
            }
        }
    }
}

export const UpgradeToProModal: React.FC<UpgradeToProModalProps> = ({
    isOpen,
    onClose,
    limitType,
    defaultPlan = 'year',
    customMessage
}) => {
    const { user } = useAuthStore()
    const { plans: PLANS, currency: payCurrency } = getPlans(user?.country)
    const message = LIMIT_MESSAGES[limitType]
    const [isLoading, setIsLoading] = useState(false)
    const [selectedPlan, setSelectedPlan] = useState<'month' | 'year'>(defaultPlan)
    const [appliedPromo, setAppliedPromo] = useState<string | null>(null)

    // Partner discount logic
    const PARTNER_DISCOUNT = 0.20 // 20%
    const hasPartnerDiscount = !!user?.invitedByPartnerCode || !!appliedPromo

    const getDisplayPrice = (basePrice: number) => {
        if (hasPartnerDiscount) {
            return Math.round(basePrice * (1 - PARTNER_DISCOUNT))
        }
        return basePrice
    }

    // Check if subscription expired
    const isExpired = !!(user?.proExpiresAt && new Date(user.proExpiresAt) < new Date())

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
                    planId: selectedPlan,
                    promoCode: appliedPromo || undefined
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

    const getTitle = () => {
        if (customMessage) return 'Доступ ограничено'
        if (isExpired) return 'Продлите подписку Pro'
        return message.title
    }

    const getDescription = () => {
        if (customMessage) return customMessage
        if (isExpired) return 'Ваша подписка истекла. Чтобы снова получить доступ к заблокированным функциям и данным, пожалуйста, продлите подписку.'
        return message.description
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
                        <Zap size={16} fill="white" />
                        Tuterra PRO
                    </div>
                    <h2 className={styles.title}>
                        {getTitle()} <span>без ограничений</span>
                    </h2>
                    <p className={styles.subtitle}>
                        {getDescription()}
                    </p>

                    {hasPartnerDiscount && (
                        <div className={styles.discountBadge}>
                            🎁 Промокод активирован: скидка 20%
                        </div>
                    )}
                </div>


                <div className={styles.content}>
                    {!hasPartnerDiscount && (
                        <div className={styles.promoSection}>
                            <p className={styles.promoLabel}>У вас есть промокод ?</p>
                            <PartnerPromoInput
                                onSuccess={setAppliedPromo}
                                initialCode={appliedPromo}
                            />


                        </div>
                    )}

                    <div className={styles.plans}>
                        {(Object.values(PLANS)).map((plan) => (
                            <div
                                key={plan.id}
                                className={`${styles.planCard} ${selectedPlan === plan.id ? styles.planCardActive : ''}`}
                                onClick={() => setSelectedPlan(plan.id as 'month' | 'year')}
                            >
                                {plan.id === 'year' && (
                                    <div className={styles.savingsBadge}>
                                        {hasPartnerDiscount ? 'Выгода 46%' : plan.savings}
                                    </div>
                                )}
                                <div className={styles.planLabel}>{plan.id === 'year' ? 'Выгодный' : 'Базовый'}</div>
                                <div className={styles.planPeriod}>{plan.label}</div>
                                <div className={styles.planPrice}>
                                    <span className={styles.amount}>{formatCurrency(getDisplayPrice(plan.price), payCurrency)}</span>
                                    {hasPartnerDiscount && plan.id === 'year' && (
                                        <>
                                            <span className={styles.oldPrice}>{formatCurrency(plan.price, payCurrency)}</span>
                                            <span className={styles.oldPrice}>{formatCurrency(plan.oldPrice!, payCurrency)}</span>
                                        </>
                                    )}
                                    {hasPartnerDiscount && plan.id === 'month' && (
                                        <span className={styles.oldPrice}>{formatCurrency(plan.price, payCurrency)}</span>
                                    )}
                                    {!hasPartnerDiscount && plan.oldPrice && <span className={styles.oldPrice}>{formatCurrency(plan.oldPrice, payCurrency)}</span>}
                                </div>
                                <div className={styles.planNote}>
                                    {hasPartnerDiscount && plan.id === 'year'
                                        ? `${formatCurrency(Math.round(getDisplayPrice(plan.price) / 12), payCurrency)} / мес`
                                        : (plan.id === 'year' ? `${formatCurrency(Math.round(plan.price / 12), payCurrency)} / мес` : plan.note)
                                    }
                                </div>
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
                        {isLoading ? 'Загрузка...' : `Оплатить ${formatCurrency(getDisplayPrice(PLANS[selectedPlan].price), payCurrency)}`}
                    </Button>
                    <button onClick={onClose} className={styles.closeButton} disabled={isLoading}>
                        Может быть позже
                    </button>
                </div>
            </div>
        </Modal>
    )
}
