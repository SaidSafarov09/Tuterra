'use client'

import React from 'react'
import { motion } from 'framer-motion'
import {
    Calendar,
    TrendingUp,
    ShieldCheck,
    Zap,
    Users
} from 'lucide-react'
import styles from './FeatureSection.module.scss'

const FeatureCard = ({ title, description, icon: Icon, color, children, delay }: any) => (
    <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className={styles.card}
    >
        <div className={styles.iconBox} style={{ background: `${color}10`, color }}>
            <Icon size={30} />
        </div>
        <div>
            <h3 className={styles.cardTitle}>{title}</h3>
            <p className={styles.cardDesc}>{description}</p>
        </div>
        <div className={styles.preview}>
            {children}
        </div>
    </motion.div>
)

export const FeatureSection = () => {
    return (
        <section id="features" className={styles.section}>
            <div className={styles.container}>
                <div className={styles.header}>
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className={styles.badge}
                    >
                        <Zap size={18} fill="currentColor" /> Всё для ежедневной работы
                    </motion.div>
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className={styles.title}
                    >
                        Современный сервис <br />
                        <span>для частных преподавателей</span>
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className={styles.description}
                    >
                        Мы собрали все необходимые инструменты в одном интерфейсе, чтобы вы могли тратить время на учеников, а не на заполнение таблиц.
                    </motion.p>
                </div>

                <div className={styles.featureGrid}>
                    {/* Feature 1: Intelligent Scheduling */}
                    <FeatureCard
                        title="Удобное расписание"
                        description="Все ваши занятия перед глазами. Система помогает избежать накладок и автоматически напоминает о предстоящих уроках."
                        icon={Calendar}
                        color="#4A6CF7"
                        delay={0}
                    >
                        <div className={styles.mockLesson}>
                            <div className={styles.mockLessonHeader}>
                                <div className={styles.time}>Сегодня, 18:30</div>
                                <div className={styles.status}>ПОДТВЕРЖДЕНО</div>
                            </div>
                            <div className={styles.studentInfo}>
                                <div className={styles.avatar}>М</div>
                                <div className={styles.details}>
                                    <div className={styles.name}>Математика: ЕГЭ</div>
                                    <div className={styles.sub}>Групповое • 5 человек</div>
                                </div>
                            </div>
                        </div>
                    </FeatureCard>

                    {/* Feature 2: Financial Order */}
                    <FeatureCard
                        title="Финансовый порядок"
                        description="Автоматизируйте учет платежей. Забудьте о бесконечных сверках и напоминаниях — система сама покажет, кто и когда должен оплатить."
                        icon={TrendingUp}
                        color="#10B981"
                        delay={0.1}
                    >
                        <div className={styles.mockStats}>
                            <div className={`${styles.statItem} ${styles.positive}`}>
                                <div className={styles.label}>ВЫРУЧКА</div>
                                <div className={styles.value}>+145%</div>
                            </div>
                            <div className={`${styles.statItem} ${styles.negative}`}>
                                <div className={styles.label}>ДОЛГИ</div>
                                <div className={styles.value}>0 ₽</div>
                            </div>
                        </div>
                    </FeatureCard>

                    {/* Feature 3: Student CRM */}
                    <FeatureCard
                        title="Личные дела учеников"
                        description="Полноценная база данных ваших учеников: контакты, история уроков и пройденные темы всегда под рукой."
                        icon={Users}
                        color="#8B5CF6"
                        delay={0.2}
                    >
                        <div className={styles.mockStudentCard}>
                            <div className={styles.bar} style={{ background: '#8B5CF6' }} />
                            <div className={styles.content}>
                                <div className={styles.name}>Алексей Волков</div>
                                <div className={styles.progress}>
                                    <div className={styles.fill} style={{ width: '85%', background: '#8B5CF6' }} />
                                </div>
                            </div>
                            <div className={styles.value} style={{ color: '#8B5CF6' }}>85%</div>
                        </div>
                    </FeatureCard>

                    {/* Feature 4: High Security */}
                    <FeatureCard
                        title="Надежность и защита"
                        description="Ваша база учеников — это ценный капитал. Мы гарантируем защиту данных и 99.9% доступность системы с любого устройства."
                        icon={ShieldCheck}
                        color="#F59E0B"
                        delay={0.3}
                    >
                        <div className={styles.tags}>
                            {['Защита SSL', 'Облачный бэкап', 'Шифрование', 'Доступ 24/7'].map(tag => (
                                <span key={tag} className={styles.tag}>
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </FeatureCard>
                </div>
            </div>
        </section>
    )
}
