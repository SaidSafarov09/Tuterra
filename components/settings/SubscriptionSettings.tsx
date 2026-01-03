import React, { useState } from 'react';
import { useAuthStore } from '@/store/auth';
import { Button } from '@/components/ui/Button';
import { UpgradeToProModal } from '@/components/pro/UpgradeToProModal';
import { Crown, Check, Calendar, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import styles from './SubscriptionSettings.module.scss';

export const SubscriptionSettings: React.FC = () => {
    const { user } = useAuthStore();
    const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

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

    const proFeatures = [
        'Безлимитное количество учеников и групп',
        'Безлимитное подключение учеников к платформе',
        'Планы обучения для групп',
        'Аналитика доходов и статистика роста',
        'Приоритетная поддержка',
        'Отсутствие любых лимитов платформы'
    ];

    const [selectedPlanId, setSelectedPlanId] = useState<'month' | 'year'>('year');

    const PLANS = [
        { id: 'month', label: 'Месяц', price: '490 ₽', note: 'Базовый тариф', savings: null },
        { id: 'year', label: 'Год', price: '3 990 ₽', note: 'Выгодный тариф', savings: 'Выгода 32%' }
    ];

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <div className={styles.header}>
                    <div className={styles.statusInfo}>
                        <span className={styles.statusLabel}>Текущий план</span>
                        <div className={styles.statusValue}>
                            {isPro ? (
                                <>
                                    <span>Tuterra PRO</span>
                                    <span className={styles.proBadge}>Активен</span>
                                </>
                            ) : (
                                <>
                                    <span>Бесплатная версия</span>
                                    {isExpired && <span className={styles.proBadge} style={{ background: 'var(--error)', color: 'white' }}>Истекла</span>}
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
                                <h3 className={styles.freeTitle}>Выберите подходящий тариф PRO</h3>
                                <p className={styles.freeDescription}>
                                    Перейдите на PRO, чтобы убрать лимиты и получить доступ к полной аналитике и автоматизации.
                                </p>
                            </div>

                            <div className={styles.plansSwitcher}>
                                {PLANS.map(plan => (
                                    <div
                                        key={plan.id}
                                        className={`${styles.planOption} ${selectedPlanId === plan.id ? styles.activePlan : ''}`}
                                        onClick={() => setSelectedPlanId(plan.id as 'month' | 'year')}
                                    >
                                        {plan.savings && <div className={styles.savingsLabel}>{plan.savings}</div>}
                                        <div className={styles.planOptionLabel}>{plan.label}</div>
                                        <div className={styles.planOptionPrice}>{plan.price}</div>
                                        <div className={styles.planOptionNote}>{plan.note}</div>
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
                                onClick={() => setIsUpgradeModalOpen(true)}
                                fullWidth
                            >
                                {selectedPlanId === 'year' ? 'Оформить годовую подписку' : 'Оформить подписку на месяц'}
                                <ArrowRight size={20} style={{ marginLeft: '12px' }} />
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

            <UpgradeToProModal
                isOpen={isUpgradeModalOpen}
                onClose={() => setIsUpgradeModalOpen(false)}
                limitType="general"
                defaultPlan={selectedPlanId}
            />
        </div>
    );
};
