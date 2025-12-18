'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Check, X, Shield, Zap, Sparkles, TrendingUp } from 'lucide-react'
import styles from './Comparison.module.scss'
import { useMediaQuery } from '@/hooks/useMediaQuery'

export const Comparison = () => {
    const isTouch = useMediaQuery('(pointer: coarse)')
    const MotionDiv = isTouch ? 'div' : motion.div;

    const stats = [
        { label: 'Доверие учеников', value: '98%', sub: 'Остаются надолго', icon: Shield },
        { label: 'Освобождённое время', value: '10-12ч', sub: 'Каждую неделю', icon: Zap },
        { label: 'Финансовый рост', value: '+25-30%', sub: 'За первые месяцы', icon: TrendingUp },
    ]

    return (
        <section id="why-us" className={styles.section}>
            <div className={`${styles.magicBlur} ${styles.magicBlurPrimary}`} />
            <div className={`${styles.magicBlur} ${styles.magicBlurSecondary}`} />

            <div className={styles.container}>
                <div className={styles.header}>
                    <MotionDiv
                        {...(isTouch ? {} : {
                            initial: { opacity: 0, scale: 0.9 },
                            whileInView: { opacity: 1, scale: 1 },
                            viewport: { once: true }
                        })}
                        className={styles.badge}
                    >
                        <Sparkles size={16} /> Эффект, а не обещания
                    </MotionDiv>
                    <h2 className={styles.title}>
                        <span className={styles.gradientText}>Система, которая</span> <br />
                        <span className={styles.accentText}>работает за вас</span>
                    </h2>
                </div>

                <div className={styles.comparisonGrid}>
                    {/* The Chaos */}
                    <MotionDiv
                        {...(isTouch ? {} : {
                            initial: { opacity: 0, x: -50 },
                            whileInView: { opacity: 1, x: 0 },
                            viewport: { once: true }
                        })}
                        className={`${styles.card} ${styles.cardChaos}`}
                    >
                        <div className={`${styles.cardHeader} ${styles.chaos}`}>
                            <X size={24} /> Как обычно бывает
                        </div>
                        <div className={styles.list}>
                            {[
                                'Всё держится на голове',
                                'Страх что-то забыть',
                                'Деньги считаются вручную',
                                'Усталость накапливается незаметно'
                            ].map((item, i) => (
                                <div key={i} className={`${styles.listItem} ${styles.chaos}`}>
                                    <div className={`${styles.dot} ${styles.chaos}`} />
                                    {item}
                                </div>
                            ))}
                        </div>
                    </MotionDiv>

                    <MotionDiv
                        {...(isTouch ? {} : {
                            initial: { opacity: 0, x: 50 },
                            whileInView: { opacity: 1, x: 0 },
                            viewport: { once: true }
                        })}
                        className={`${styles.card} ${styles.cardTuterra}`}
                    >
                        <div className={styles.innerBlur} />

                        <div className={`${styles.cardHeader} ${styles.tuterra}`}>
                            <Check size={24} /> Современный подход
                        </div>
                        <div className={styles.list}>
                            {[
                                'Вся информация по ученикам в одном месте',
                                'Удобная работа с телефона и ноутбука',
                                'Автоматический контроль оплат и долгов',
                                'Понятная картина доходов без ручного подсчёта'
                            ].map((item, i) => (
                                <div key={i} className={`${styles.listItem} ${styles.tuterra}`}>
                                    <div className={`${styles.dot} ${styles.tuterra}`} />
                                    {item}
                                </div>
                            ))}
                        </div>
                    </MotionDiv>
                </div>

                <div className={styles.statsGrid}>
                    {stats.map((stat, i) => (
                        <MotionDiv
                            key={i}
                            {...(isTouch ? {} : {
                                initial: { opacity: 0, y: 20 },
                                whileInView: { opacity: 1, y: 0 },
                                viewport: { once: true },
                                transition: { delay: i * 0.1 }
                            })}
                            className={styles.statCard}
                        >
                            <div className={styles.statIcon}>
                                <stat.icon size={32} />
                            </div>
                            <div className={styles.statValue}>{stat.value}</div>
                            <div className={styles.statLabel}>{stat.label}</div>
                            <div className={styles.statSub}>{stat.sub}</div>
                        </MotionDiv>
                    ))}
                </div>

                <MotionDiv
                    {...(isTouch ? {} : {
                        initial: { opacity: 0, scale: 0.95 },
                        whileInView: { opacity: 1, scale: 1 },
                        viewport: { once: true }
                    })}
                    className={styles.footer}
                >
                    <div className={styles.footerBadge}>
                        <Zap size={24} color="#4A6CF7" fill="#4A6CF7" />
                        <span className={styles.footerText}>
                            Вы занимаетесь преподаванием, а не учётом
                        </span>
                    </div>
                </MotionDiv>
            </div>
        </section>
    )
}
