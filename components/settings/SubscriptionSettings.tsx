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

    const isPro = user?.isPro || user?.plan === 'pro' || false;
    const expiryDate = user?.proExpiresAt ? new Date(user.proExpiresAt) : null;

    const proFeatures = [
        'Безлимитное количество учеников и групп',
        'Безлимитное подключение учеников к платформе',
        'Планы обучения для групп',
        'Аналитика доходов и статистика роста',
        'Приоритетная поддержка',
        'Отсутствие любых лимитов платформы'
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
                                <span>Бесплатная версия</span>
                            )}
                        </div>
                        {isPro && expiryDate && (
                            <div className={styles.expiryDate}>
                                <Calendar size={14} />
                                Доступно до {format(expiryDate, 'd MMMM yyyy', { locale: ru })}
                            </div>
                        )}
                    </div>
                </div>

                <div className={styles.content}>
                    {!isPro ? (
                        <div className={styles.freeInfo}>
                            <div>
                                <h3 className={styles.freeTitle}>Используйте все возможности Tuterra</h3>
                                <p className={styles.freeDescription}>
                                    На бесплатном тарифе вы ограничены в количестве учеников и функционале.
                                    Перейдите на PRO, чтобы масштабировать свою деятельность.
                                </p>
                            </div>

                            <div className={styles.pricing}>
                                <span className={styles.price}>490 ₽</span>
                                <span className={styles.period}>/ месяц</span>
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
                                Обновиться до PRO
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
            />
        </div>
    );
};
