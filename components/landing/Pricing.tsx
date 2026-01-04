'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { Check, Sparkles, Zap } from 'lucide-react'
import Link from 'next/link'
import styles from './Pricing.module.scss'
import { useMediaQuery } from '@/hooks/useMediaQuery'

const plans = [
    {
        id: 'free',
        name: 'Базовый',
        price: '0',
        description: 'Идеален для частных преподавателей с небольшой нагрузкой, которые хотят уйти от хаоса.',
        features: [
            'До 3-х активных учеников',
            '1 рабочая группа',
            '1 предмет обучения',
            'Учет оплат и задолженностей',
            'Работа с любого устройства'
        ],
        cta: 'Попробовать бесплатно',
        primary: false,
        isPro: false,
        link: '/auth',
        period: 'месяц'
    },
    {
        id: 'pro_month',
        name: 'PRO Месяц',
        price: '490',
        description: 'Для тех, кто хочет полный контроль над временем и доходом без лишних лимитов.',
        features: [
            'Безлимитно учеников и групп',
            'Глубокая интеграция с Telegram',
            'Аналитика доходов за 6 месяцев',
            'Автоматический контроль задолженностей',
            'Журнал посещаемости и прогресса',
            'Безлимитные предметы и темы'
        ],
        cta: 'Подписка на месяц',
        primary: true,
        isPro: true,
        link: '/auth?plan=month',
        period: 'месяц'
    },
    {
        id: 'pro_year',
        name: 'PRO Год',
        price: '3 990',
        oldPrice: '5 880',
        savings: 'Выгода 32%',
        description: 'Максимальная выгода для профессионалов. По цене всего 332 ₽ в месяц.',
        features: [
            'Всё, что есть в PRO версии',
            'Экономия 1 890 ₽ (выгоднее на 32%)',
            'Приоритетная поддержка 24/7',
            'Персональная настройка бота',
            'Ранний доступ к новым функциям'
        ],
        status: 'Выгодный',
        cta: 'Подписка на год',
        primary: true,
        isPro: true,
        link: '/auth?plan=year',
        period: 'год'
    }
]

export const Pricing = () => {
    const isTouch = useMediaQuery('(pointer: coarse)')
    const MotionDiv = isTouch ? 'div' : motion.div;

    return (
        <section id="pricing" className={styles.section}>
            <div className={styles.container}>
                <MotionDiv
                    {...(isTouch ? {} : {
                        initial: { opacity: 0, y: 20 },
                        whileInView: { opacity: 1, y: 0 },
                        viewport: { once: true }
                    })}
                    className={styles.header}
                >
                    <div className={styles.badge}>
                        <Zap size={16} fill="currentColor" /> Прозрачная модель без скрытых условий
                    </div>
                    <h2 className={styles.title}>
                        Инвестируйте в своё <br /> <span>свободное время</span>
                    </h2>
                    <p className={styles.subtitle}>Начните бесплатно, протестируйте в реальной работе и решите, нужен ли вам максимум.</p>
                </MotionDiv>

                <div className={styles.pricingGrid}>
                    {plans.map((plan, i) => (
                        <MotionDiv
                            key={i}
                            {...(isTouch ? {} : {
                                initial: { opacity: 0, y: 40 },
                                whileInView: { opacity: 1, y: 0 },
                                viewport: { once: true },
                                transition: { delay: i * 0.2, duration: 0.8, ease: [0.16, 1, 0.3, 1] }
                            })}
                            className={`${styles.plan} ${plan.primary ? styles.primary : ''} ${plan.isPro ? styles.proPlan : ''} ${plan.id === 'pro_year' ? styles.yearlyPlan : ''}`}
                        >
                            {plan.status && (
                                <div className={styles.recommended}>
                                    <Sparkles size={14} /> {plan.status}
                                </div>
                            )}

                            <h3 className={styles.planName}>{plan.name}</h3>

                            <div className={styles.priceBox}>
                                <div className={styles.mainPrice}>
                                    <span className={styles.price}>{plan.price} ₽</span>
                                    <span className={styles.period}>/ {plan.period}</span>
                                </div>
                                {plan.oldPrice && (
                                    <div className={styles.savingsRow}>
                                        <span className={styles.oldPrice}>{plan.oldPrice} ₽</span>
                                        <span className={styles.savingsBadge}>{plan.savings}</span>
                                    </div>
                                )}
                            </div>

                            <p className={styles.planDesc}>{plan.description}</p>

                            <div className={styles.features}>
                                {plan.features.map((f, index) => (
                                    <div key={index} className={styles.feature}>
                                        <div className={`${styles.check} ${plan.primary ? styles.primary : styles.ghost}`}>
                                            <Check size={14} strokeWidth={4} />
                                        </div>
                                        {f}
                                    </div>
                                ))}
                            </div>

                            <Link
                                href={plan.link}
                                style={{ textDecoration: 'none' }}
                            >
                                <Button
                                    variant={plan.primary ? 'primary' : 'outline'}
                                    fullWidth
                                    className={`${styles.cta} ${plan.primary ? styles.ctaPrimary : styles.ctaGhost}`}
                                    onClick={() => {
                                        if (plan.id !== 'free') {
                                            const planToSave = plan.id === 'pro_month' ? 'month' : 'year'
                                            localStorage.setItem('selectedPlan', planToSave)
                                        }
                                    }}
                                >
                                    {plan.cta}
                                </Button>
                            </Link>
                        </MotionDiv>
                    ))}
                </div>
            </div>
        </section>
    )
}
