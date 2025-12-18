'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { ArrowRight, Sparkles, Zap, Star } from 'lucide-react'
import Link from 'next/link'
import styles from './CTASection.module.scss'

export const CTASection = () => {
    return (
        <section className={styles.section}>
            <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                className={styles.container}
            >
                <div className={styles.content}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        className={styles.badge}
                    >
                        <Sparkles size={16} /> Попробуйте Tuterra бесплатно
                    </motion.div>

                    <h2 className={styles.title}>
                        <span className={styles.gradientText}>
                            Пора навести порядок<br />
                        </span>
                        <span className={styles.accentText}>в своих делах</span>
                    </h2>

                    <p className={styles.description}>
                        Присоединяйтесь к 500+ преподавателям, которые уже автоматизировали свой рост с Tuterra.
                    </p>

                    <div className={styles.actions}>
                        <Link href="/auth" style={{ textDecoration: 'none' }}>
                            <Button size="large" variant="primary" className={styles.ctaButton}>
                                Начать бесплатно <ArrowRight style={{ marginLeft: '12px' }} size={24} />
                            </Button>
                        </Link>

                        <div className={styles.trustBadges}>
                            <div className={styles.trustItem}>
                                <div className={styles.stars}>
                                    {[1, 2, 3, 4, 5].map(i => <Star key={i} size={14} fill="#F59E0B" color="#F59E0B" />)}
                                </div>
                                <p>4.9/5 рейтинг</p>
                            </div>
                            <div className={styles.trustItem}>
                                <Zap size={16} color="#4A6CF7" fill="#4A6CF7" />
                                <p>Регистрация за 30 секунд</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Decorative Elements */}
                <div className={`${styles.decoration} ${styles.decorationTop}`} />
                <div className={`${styles.decoration} ${styles.decorationBottom}`} />
            </motion.div>
        </section>
    )
}
