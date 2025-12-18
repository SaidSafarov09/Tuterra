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
        name: 'Базовый',
        price: '0',
        description: 'Идеален для частных преподавателей с небольшой нагрузкой, которые хотят уйти от хаоса и таблиц.',
        features: [
            'До 5 активных учеников',
            'Расписание занятий без накладок',
            'Учет оплат и задолженностей',
            'Работа с телефона и компьютера',
            'История занятий и тем'
        ],
        cta: 'Попробовать бесплатно',
        primary: false
    },
    {
        name: 'Профи',
        price: '490',
        description: 'Для тех, кто зарабатывает на преподавании и хочет полный контроль над временем и доходом.',
        features: [
            'Неограниченное количество учеников',
            'Групповые и индивидуальные занятия',
            'Подробная аналитика доходов',
            'Автоматический контроль оплат',
            'Отчеты и заметки по каждому ученику',
            'Приоритетная поддержка'
        ],
        cta: 'Перейти на Профи',
        primary: true
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
                        Платите только за порядок <br /> <span>а не за лишние функции</span>
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
                            className={`${styles.plan} ${plan.primary ? styles.primary : ''}`}
                        >
                            {plan.primary && (
                                <div className={styles.recommended}>
                                    <Sparkles size={14} /> ВЫБОР ОПЫТНЫХ ПРЕПОДАВАТЕЛЕЙ
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
                        </MotionDiv>
                    ))}
                </div>
            </div>
        </section>
    )
}
