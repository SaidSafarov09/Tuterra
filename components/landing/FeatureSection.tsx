'use client'

import React from 'react'
import { motion } from 'framer-motion'
import {
    Calendar,
    TrendingUp,
    Zap,
    Users,
    Send
} from 'lucide-react'
import styles from './FeatureSection.module.scss'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { Logo } from '../icons/Logo'

const FeatureCard = ({ title, description, icon: Icon, color, children, delay, isTouch }: any) => {
    const Component: any = isTouch ? 'div' : motion.div;
    const motionProps = isTouch ? {} : {
        initial: { opacity: 0, y: 30 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true },
        transition: { delay, duration: 0.8, ease: [0.16, 1, 0.3, 1] }
    };

    return (
        <Component
            {...motionProps}
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
        </Component>
    );
};

export const FeatureSection = () => {
    const isTouch = useMediaQuery('(pointer: coarse)')

    const HeaderComponent = isTouch ? 'div' : motion.div;
    const headerMotionProps = isTouch ? {} : {
        initial: { opacity: 0, y: 20 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true }
    };

    return (
        <section id="features" className={styles.section}>
            <div className={styles.container}>
                <div className={styles.header}>
                    <HeaderComponent
                        {...(isTouch ? {} : {
                            initial: { opacity: 0, x: -20 },
                            whileInView: { opacity: 1, x: 0 },
                            viewport: { once: true }
                        })}
                        className={styles.badge}
                    >
                        <Zap size={18} fill="currentColor" /> Инструменты для репетитора
                    </HeaderComponent>

                    <HeaderComponent
                        {...headerMotionProps}
                        className={styles.title}
                    >
                        <span className={styles.gradientText}>Технологии</span>, которые делают<br />
                        <span>обучение системным</span>
                    </HeaderComponent>

                    <HeaderComponent
                        {...(isTouch ? {} : {
                            initial: { opacity: 0, y: 20 },
                            whileInView: { opacity: 1, y: 0 },
                            viewport: { once: true },
                            transition: { delay: 0.1 }
                        })}
                        className={styles.description}
                    >
                        Забудьте про хаос в блокнотах. Мы объединили профессиональный календарь,
                        автоматический финансовый учет и персонального ассистента в Telegram в один мощный инструмент.
                    </HeaderComponent>
                </div>

                <div className={styles.featureGrid}>
                    <FeatureCard
                        title="Интеллектуальный календарь"
                        description="Ваше расписание с учетом региональных праздников, выходных и часовых поясов. Управляйте групповыми и индивидуальными уроками без рисков накладок."
                        icon={Calendar}
                        color="#4A6CF7"
                        delay={0}
                        isTouch={isTouch}
                    >
                        <div className={styles.mockLesson}>
                            <div className={styles.mockLessonHeader}>
                                <div className={styles.time}>Сегодня, 18:30</div>
                                <div className={styles.status}>Оплачено</div>
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

                    <FeatureCard
                        title="Финансовая аналитика 360°"
                        description="Глубокий анализ доходов за 6 месяцев, автоматический расчет долгов по урокам и наглядные графики. Вы всегда знаете, сколько заработали и сколько еще в пути."
                        icon={TrendingUp}
                        color="#10B981"
                        delay={0.1}
                        isTouch={isTouch}
                    >
                        <div className={styles.mockStats}>
                            <div className={`${styles.statItem} ${styles.positive}`}>
                                <div className={styles.label}>Доход</div>
                                <div className={styles.value}>+120.000₽</div>
                            </div>
                            <div className={`${styles.statItem} ${styles.negative}`}>
                                <div className={styles.label}>ДОЛГИ</div>
                                <div className={styles.value}>0 ₽</div>
                            </div>
                        </div>
                    </FeatureCard>

                    <FeatureCard
                        title="Личные дела учеников"
                        description="Карточки учеников с историей занятий, заметками и прогрессом. Вся важная информация - там, где она нужна."
                        icon={Users}
                        color="#8B5CF6"
                        delay={0.2}
                        isTouch={isTouch}
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

                    <FeatureCard
                        title="Персональный агент в Telegram"
                        description="Ваш бизнес в кармане: бот мгновенно пришлет уведомление о новом ученике, напомнит о завтрашних уроках и поможет быстро отметить оплату, не заходя в браузер."
                        icon={Send}
                        color="#2563eb"
                        delay={0.3}
                        isTouch={isTouch}
                    >
                        <div className={styles.mockTelegram}>
                            <div className={styles.mockTelegramHeader}>
                                <div className={styles.botIcon}>
                                    <Logo size={24} />
                                </div>
                                TuterraBot
                            </div>
                            <div className={styles.mockTelegramMessage}>
                                🔔 <strong>Напоминание:</strong><br />
                                Через 15 минут занятие с учеником <strong>Ангелина</strong> по предмету Математика.
                            </div>
                        </div>
                    </FeatureCard>
                </div>
            </div>
        </section>
    )
}
