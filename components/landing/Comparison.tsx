'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Check, X, Shield, Zap, Sparkles, TrendingUp } from 'lucide-react'
import styles from './Comparison.module.scss'

export const Comparison = () => {
    const stats = [
        { label: 'Лояльность студентов', value: '98%', sub: '+24% к среднему', icon: Shield },
        { label: 'Свободное время', value: '12ч', sub: 'В неделю', icon: Zap },
        { label: 'Рост дохода', value: '+30%', sub: 'Через 3 месяца', icon: TrendingUp },
    ]

    return (
        <section id="why-us" className={styles.section}>
            <div className={`${styles.magicBlur} ${styles.magicBlurPrimary}`} />
            <div className={`${styles.magicBlur} ${styles.magicBlurSecondary}`} />

            <div className={styles.container}>
                <div className={styles.header}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className={styles.badge}
                    >
                        <Sparkles size={16} /> Результат, который можно измерить
                    </motion.div>
                    <h2 className={styles.title}>
                        <span className={styles.gradientText}>Наведите порядок</span> <br />
                        <span className={styles.accentText}>в своем расписании</span>
                    </h2>
                </div>

                <div className={styles.comparisonGrid}>
                    {/* The Chaos */}
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className={`${styles.card} ${styles.cardChaos}`}
                    >
                        <div className={`${styles.cardHeader} ${styles.chaos}`}>
                            <X size={24} /> Работа без системы
                        </div>
                        <div className={styles.list}>
                            {[
                                'Мессенджеры вместо системы (сообщения теряются)',
                                'Таблицы, которые неудобно вести с телефона',
                                'Забытые оплаты и неловкие напоминания',
                                'Траты времени на ручной сбор отчетов и планов'
                            ].map((item, i) => (
                                <div key={i} className={`${styles.listItem} ${styles.chaos}`}>
                                    <div className={`${styles.dot} ${styles.chaos}`} />
                                    {item}
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* The Tuterra */}
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className={`${styles.card} ${styles.cardTuterra}`}
                    >
                        <div className={styles.innerBlur} />

                        <div className={`${styles.cardHeader} ${styles.tuterra}`}>
                            <Check size={24} /> Стандарт Tuterra
                        </div>
                        <div className={styles.list}>
                            {[
                                'Централизованный учет прогресса студентов',
                                'Интерфейс, спроектированный для мобильных',
                                'Автоматизированный контроль задолженностей',
                                'Прозрачная аналитика дохода в несколько нажатий'
                            ].map((item, i) => (
                                <div key={i} className={`${styles.listItem} ${styles.tuterra}`}>
                                    <div className={`${styles.dot} ${styles.tuterra}`} />
                                    {item}
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>

                <div className={styles.statsGrid}>
                    {stats.map((stat, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className={styles.statCard}
                        >
                            <div className={styles.statIcon}>
                                <stat.icon size={32} />
                            </div>
                            <div className={styles.statValue}>{stat.value}</div>
                            <div className={styles.statLabel}>{stat.label}</div>
                            <div className={styles.statSub}>{stat.sub}</div>
                        </motion.div>
                    ))}
                </div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className={styles.footer}
                >
                    <div className={styles.footerBadge}>
                        <Zap size={24} color="#4A6CF7" fill="#4A6CF7" />
                        <span className={styles.footerText}>
                            В 2.5 раза меньше времени на бумажную рутину
                        </span>
                    </div>
                </motion.div>
            </div>
        </section>
    )
}
