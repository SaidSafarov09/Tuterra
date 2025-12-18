'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import {
    ArrowRight,
    Play,
    Atom,
    Binary,
    Sigma,
    Music,
    Globe,
    Palette,
    Lightbulb,
    Zap,
    Smartphone,
    ShieldCheck,
    Cpu,
    Type
} from 'lucide-react'
import Link from 'next/link'
import styles from './Hero.module.scss'

const FloatingIcon = ({ Icon, size, color, top, left, delay, rotate }: any) => (
    <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{
            opacity: [0.2, 0.5, 0.2],
            scale: [1, 1.1, 1],
            rotate: [rotate, rotate + 10, rotate],
            y: [0, -20, 0]
        }}
        transition={{
            duration: 5 + Math.random() * 5,
            repeat: Infinity,
            delay: delay,
            ease: "easeInOut"
        }}
        className={styles.floatingIcon}
        style={{ top, left, color } as any}
    >
        <Icon size={size} strokeWidth={1.5} />
    </motion.div>
)

export const Hero = () => {
    const scienceIcons = [
        { Icon: Atom, size: 40, color: '#4A6CF7', top: '15%', left: '10%', delay: 0, rotate: 15 },
        { Icon: Binary, size: 32, color: '#10B981', top: '25%', left: '85%', delay: 1, rotate: -10 },
        { Icon: Sigma, size: 48, color: '#F59E0B', top: '65%', left: '5%', delay: 2, rotate: 5 },
        { Icon: Type, size: 28, color: '#EF4444', top: '80%', left: '90%', delay: 0.5, rotate: -15 },
        { Icon: Music, size: 36, color: '#8B5CF6', top: '45%', left: '92%', delay: 1.5, rotate: 20 },
        { Icon: Globe, size: 44, color: '#3B82F6', top: '10%', left: '80%', delay: 2.5, rotate: -5 },
        { Icon: Palette, size: 30, color: '#EC4899', top: '55%', left: '3%', delay: 3, rotate: 10 },
        { Icon: Lightbulb, size: 52, color: '#FCD34D', top: '20%', left: '15%', delay: 1.2, rotate: -8 },
    ]

    const features = [
        {
            icon: Smartphone,
            title: 'Всегда под рукой',
            desc: 'Tuterra устанавливается на смартфон как обычное приложение. Быстрый доступ к расписанию даже на ходу, без долгого ожидания загрузки сайта.',
            color: '#4A6CF7'
        },
        {
            icon: ShieldCheck,
            title: 'Надежность в деталях',
            desc: 'Ваши данные и история оплат в безопасности. Мы используем надежные протоколы защиты, чтобы вы могли спокойно заниматься любимым делом.',
            color: '#10B981'
        },
        {
            icon: Cpu,
            title: 'Порядок в календаре',
            desc: 'Система сама предупредит о накладках в расписании. Занятия, переносы и праздники — всё под вашим контролем в одном понятном окне.',
            color: '#8B5CF6'
        }
    ]

    return (
        <section className={styles.hero}>
            {/* Animated Science Icons */}
            {scienceIcons.map((icon, i) => <FloatingIcon key={i} {...icon} />)}

            <div className={styles.container}>
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className={styles.badge}
                    >
                        <Zap size={16} fill="currentColor" />
                        МЕСТО УПРАВЛЕНИЯ ВАШИМИ ЗАНЯТИЯМИ
                    </motion.div>

                    <h1 className={styles.title}>
                        Масштабируйте свой <br />
                        <span className={styles.gradientText}>
                            талант преподавателя
                        </span>
                    </h1>

                    <p className={styles.description}>
                        Удобный органайзер для репетиторов. Ведите расписание, отмечайте оплаты и следите за прогрессом учеников в одном месте без лишних хлопот.
                    </p>

                    <div className={styles.actions}>
                        <Link href="/auth">
                            <Button size="large" className={styles.primaryButton}>
                                Попробовать бесплатно <ArrowRight style={{ marginLeft: '12px' }} size={22} />
                            </Button>
                        </Link>
                        <Button
                            variant="ghost"
                            size="large"
                            className={styles.ghostButton}
                            onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
                        >
                            <Play style={{ marginRight: '12px', fill: 'currentColor' }} size={18} /> Увидеть в действии
                        </Button>
                    </div>
                </motion.div>

                {/* Feature Info Grid instead of Dashboard */}
                <div className={styles.featureGrid}>
                    {features.map((f, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 40 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 + i * 0.1, duration: 1 }}
                            className={styles.featureCard}
                        >
                            <div className={styles.iconWrapper} style={{ background: `${f.color}10`, color: f.color }}>
                                <f.icon size={28} />
                            </div>
                            <h3 className={styles.featureTitle}>{f.title}</h3>
                            <p className={styles.featureDesc}>{f.desc}</p>

                            {/* Accent line */}
                            <div className={styles.accentLine} style={{ background: f.color }} />
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    )
}
