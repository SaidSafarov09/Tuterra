'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { Check, Sparkles, Zap } from 'lucide-react'
import Link from 'next/link'
import styles from './Pricing.module.scss'

const plans = [
    {
        name: 'Стартовый',
        price: '0',
        description: 'Подойдет для тех, кто только начинает вести электронный учет уроков.',
        features: [
            'До 5 активных студентов',
            'Полный учет финансовых потоков',
            'Интеллектуальный календарь',
            'Мобильное приложение (PWA)',
            'Базовая аналитика'
        ],
        cta: 'Начать бесплатно',
        primary: false
    },
    {
        name: 'Профессиональный',
        price: '990',
        description: 'Для тех, кто хочет иметь полный контроль над своим расписанием и доходами.',
        features: [
            'Безлимитное количество студентов',
            'Групповые занятия любой сложности',
            'Глубокая аналитика доходов',
            'Приоритетный доступ к новым функциям',
            'Персональная поддержка 24/7',
            'Отчеты для родителей в вашем стиле'
        ],
        cta: 'Стать профессионалом',
        primary: true
    }
]

export const Pricing = () => {
    return (
        <section id="pricing" className={styles.section}>
            <div className={styles.container}>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className={styles.header}
                >
                    <div className={styles.badge}>
                        <Zap size={16} fill="currentColor" /> Понятные и честные тарифы
                    </div>
                    <h2 className={styles.title}>
                        Выбирайте то, что <br /> <span>подходит вам</span>
                    </h2>
                    <p className={styles.subtitle}>Начните бесплатно и переходите на профи, когда будете готовы.</p>
                </motion.div>

                <div className={styles.pricingGrid}>
                    {plans.map((plan, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.2, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                            className={`${styles.plan} ${plan.primary ? styles.primary : ''}`}
                        >
                            {plan.primary && (
                                <div className={styles.recommended}>
                                    <Sparkles size={14} /> РЕКОМЕНДУЕМЫЙ
                                </div>
                            )}

                            <h3 className={styles.planName}>{plan.name}</h3>

                            <div className={styles.priceBox}>
                                <span className={styles.price}>{plan.price} ₽</span>
                                <span className={styles.period}>/ месяц</span>
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

                            <Link href="/auth" style={{ textDecoration: 'none' }}>
                                <Button
                                    variant={plan.primary ? 'primary' : 'ghost'}
                                    fullWidth
                                    className={`${styles.cta} ${plan.primary ? styles.ctaPrimary : styles.ctaGhost}`}
                                >
                                    {plan.cta}
                                </Button>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    )
}
