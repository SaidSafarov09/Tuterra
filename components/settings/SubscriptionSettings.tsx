import React, { useState } from 'react';
import { useAuthStore } from '@/store/auth';
import { Button } from '@/components/ui/Button';
import { UpgradeToProModal } from '@/components/pro/UpgradeToProModal';
import { Crown, Check, Calendar, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { toast } from 'sonner';
import styles from './SubscriptionSettings.module.scss';

import { PartnerPromoInput } from '@/components/ui/PartnerPromoInput';
import { formatCurrency } from '@/lib/formatUtils';

export const SubscriptionSettings: React.FC = () => {
    const { user } = useAuthStore();
    const [isLoading, setIsLoading] = useState(false);
    const [selectedPlanId, setSelectedPlanId] = useState<'month' | 'year'>('year');
    const [appliedPromo, setAppliedPromo] = useState<string | null>(null);

    const checkIsPro = () => {
        if (!user) return false;
        const hasProFlag = user.isPro || user.plan === 'pro';
        if (!hasProFlag) return false;

        if (user.proExpiresAt) {
            return new Date(user.proExpiresAt) > new Date();
        }
        return true;
    };

    const isPro = checkIsPro();
    const expiryDate = user?.proExpiresAt ? new Date(user.proExpiresAt) : null;
    const isExpired = user?.proExpiresAt && new Date(user.proExpiresAt) < new Date();

    // Partner discount logic
    const PARTNER_DISCOUNT = 0.20; // 20%
    const hasPartnerDiscount = !!user?.invitedByPartnerCode || !!appliedPromo;

    const getDisplayPrice = (basePrice: number) => {
        if (hasPartnerDiscount) {
            return Math.round(basePrice * (1 - PARTNER_DISCOUNT));
        }
        return basePrice;
    };

    const proFeatures = [
        'Безлимитное количество учеников и групп',
        'Безлимитное подключение учеников к платформе',
        'Планы обучения для групп',
        'Аналитика доходов и статистика роста',
        'Неограниченные планы обучения для учеников ',
        'Отсутствие любых лимитов платформы'
    ];

    const isKz = user?.country === 'KZ'
    const isBy = user?.country === 'BY'
    const payCurrency = isKz ? '₸' : isBy ? 'BYN' : '₽'

    const PLANS = [
        {
            id: 'month',
            label: 'Месяц',
            price: isKz ? 3200 : isBy ? 18 : 490,
            oldPrice: null,
            note: 'Базовый тариф',
            savings: null
        },
        {
            id: 'year',
            label: 'Год',
            price: isKz ? 26000 : isBy ? 147 : 3990,
            oldPrice: isKz ? 38000 : isBy ? 217 : 5880,
            note: isKz ? '2166 / мес' : isBy ? '12 / мес' : '332 / мес',
            savings: 'Выгода 32%'
        }
    ];

    const handleUpgrade = async () => {
        try {
            setIsLoading(true);

            const response = await fetch('/api/payments/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    planId: selectedPlanId,
                    promoCode: appliedPromo || undefined
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to create payment');
            }

            const data = await response.json();

            if (data.confirmationUrl) {
                window.location.href = data.confirmationUrl;
            } else {
                throw new Error('No confirmation URL received');
            }
        } catch (error) {
            console.error('Payment error:', error);
            toast.error(error instanceof Error ? error.message : 'Не удалось создать платеж');
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <div className={styles.header}>
                    <div className={styles.statusInfo}>
                        <span className={styles.statusLabel}>Текущий план {isExpired && "- Бесплатная версия"}</span>
                        <div className={styles.statusValue}>
                            {isPro ? (
                                <>
                                    <span>Tuterra PRO</span>
                                    <span className={styles.proBadge}>Активен</span>
                                </>
                            ) : isExpired ? (
                                <>
                                    <span>Tuterra PRO</span>
                                    <span className={styles.proBadge} style={{ background: 'var(--error)', color: 'white' }}>Истекла</span>
                                </>
                            ) : (
                                <>
                                    <span>Бесплатная версия</span>
                                </>
                            )}
                        </div>
                        {expiryDate && (
                            <div className={styles.expiryDate}>
                                <Calendar size={14} />
                                {isPro ? 'Доступно до' : 'Истекла'} {format(expiryDate, 'd MMMM yyyy', { locale: ru })}
                            </div>
                        )}
                    </div>
                </div>

                <div className={styles.content}>
                    {!isPro ? (
                        <div className={styles.freeInfo}>
                            <div>
                                <h3 className={styles.freeTitle}>
                                    {isExpired ? 'Продлите подписку PRO' : 'Выберите подходящий тариф PRO'}
                                </h3>
                                <p className={styles.freeDescription}>
                                    {isExpired
                                        ? 'Ваша подписка закончилась. Продлите её, чтобы вернуть доступ ко всем функциям без ограничений.'
                                        : 'Перейдите на PRO, чтобы убрать лимиты и получить доступ к полной аналитике и автоматизации.'}
                                </p>
                            </div>

                            {!hasPartnerDiscount && (
                                <div className={styles.promoSection}>
                                    <p className={styles.promoLabel}>У вас есть промокод ?</p>
                                    <PartnerPromoInput
                                        onSuccess={setAppliedPromo}
                                        initialCode={appliedPromo}
                                    />
                                </div>
                            )}

                            {hasPartnerDiscount && (
                                <div className={styles.discountBanner}>
                                    🎁 Промокод активирован: скидка 20%
                                </div>
                            )}


                            <div className={styles.plansSwitcher}>
                                {PLANS.map(plan => (
                                    <div
                                        key={plan.id}
                                        className={`${styles.planOption} ${selectedPlanId === plan.id ? styles.activePlan : ''}`}
                                        onClick={() => setSelectedPlanId(plan.id as 'month' | 'year')}
                                    >
                                        {plan.id === 'year' && (
                                            <div className={styles.savingsLabel}>
                                                {hasPartnerDiscount ? 'Выгода 46%' : plan.savings}
                                            </div>
                                        )}
                                        <div className={styles.planOptionLabel}>{plan.label}</div>
                                        <div className={styles.planOptionPrice}>
                                            <span>{formatCurrency(getDisplayPrice(plan.price), payCurrency)}</span>
                                            {hasPartnerDiscount && <span className={styles.oldPrice}>{formatCurrency(plan.price, payCurrency)}</span>}
                                            {!hasPartnerDiscount && plan.oldPrice && <span className={styles.oldPrice}>{formatCurrency(plan.oldPrice, payCurrency)}</span>}
                                        </div>
                                        <div className={styles.planOptionNote}>
                                            {hasPartnerDiscount && plan.id === 'year'
                                                ? `${formatCurrency(Math.round(getDisplayPrice(plan.price) / 12), payCurrency)} / мес`
                                                : (plan.id === 'year' ? `${formatCurrency(Math.round(plan.price / 12), payCurrency)} / мес` : plan.note)}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <ul className={styles.featureList}>
                                {proFeatures.map((feature, index) => (
                                    <li key={index}>
                                        <Check size={18} />
                                        {feature}
                                    </li>
                                ))}
                            </ul>

                            <Button
                                type="button"
                                className={styles.upgradeBtn}
                                onClick={handleUpgrade}
                                fullWidth
                                disabled={isLoading}
                            >
                                {isLoading
                                    ? 'Загрузка...'
                                    : isExpired
                                        ? (selectedPlanId === 'year' ? 'Продлить на год' : 'Продлить на месяц')
                                        : (selectedPlanId === 'year' ? 'Оформить годовую подписку' : 'Оформить подписку на месяц')
                                }
                                {!isLoading && <ArrowRight size={20} style={{ marginTop: '4px' }} />}
                            </Button>
                        </div>
                    ) : (
                        <div className={styles.freeInfo}>
                            <h3 className={styles.freeTitle}>Ваша подписка активна</h3>
                            <p className={styles.freeDescription}>
                                Вам доступны все функции платформы без ограничений.
                                Если у вас есть вопросы по работе сервиса, напишите нашей поддержке.
                            </p>
                            <ul className={styles.featureList}>
                                {proFeatures.map((feature, index) => (
                                    <li key={index}>
                                        <Check size={18} />
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
