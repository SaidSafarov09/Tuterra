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
import { useMediaQuery } from '@/hooks/useMediaQuery'

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
    const isTouch = useMediaQuery('(pointer: coarse)')
    const is540 = useMediaQuery('(max-width: 540px)')
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
            title: 'Удобно с любого устройства',
            desc: 'Работайте с расписанием и учениками с ноутбука, планшета или телефона. Ничего устанавливать не нужно — всё открывается прямо в браузере.',
            color: '#4A6CF7'
        },
        {
            icon: Cpu,
            title: 'Минимум действий - максимум порядка',
            desc: 'Добавляйте занятия, отмечайте оплаты и переносы за пару кликов. Интерфейс создан специально под логику репетитора.',
            color: '#8B5CF6',
        },
        {
            icon: ShieldCheck,
            title: 'Данные под контролем',
            desc: 'История занятий, оплат и учеников хранится в одном месте. Ничего не теряется и всегда доступно, когда нужно.',
            color: '#10B981',
        },
    ]

    return (
        <section className={styles.hero}>
            {is540 || isTouch ? null : scienceIcons.map((icon, i) => <FloatingIcon key={i} {...icon} />)}

            <div className={styles.container}>
                <motion.div
                    initial={isTouch ? false : { opacity: 0, y: 30 }}
                    animate={isTouch ? false : { opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                >
                    <motion.div
                        initial={isTouch ? false : { scale: 0.9, opacity: 0 }}
                        animate={isTouch ? false : { scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className={styles.badge}
                    >
                        <Zap size={16} fill="currentColor" />
                        ИНСТРУМЕНТ ДЛЯ РЕПЕТИТОРОВ
                    </motion.div>

                    <h1 className={styles.title}>
                        Управляйте занятиями<br />
                        <span className={styles.gradientText}>
                            профессионально
                        </span>
                    </h1>

                    <p className={styles.description}>
                        Больше никакой путаницы в занятиях и оплатах.<br /> Всё, что нужно <span className={styles.gradientText}>репетитору</span> - в одном месте.
                    </p>

                    <div className={styles.actions}>
                        <Link href="/auth">
                            <Button size="large" className={styles.primaryButton}>
                                Начать бесплатно <ArrowRight style={{ marginLeft: '12px' }} size={22} />
                            </Button>
                        </Link>
                        <Button
                            variant="ghost"
                            size="large"
                            className={styles.ghostButton}
                            onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
                        >
                            <Play style={{ marginRight: '12px', fill: 'currentColor' }} size={18} /> Увидеть платформу
                        </Button>
                    </div>
                </motion.div>

                {/* Feature Info Grid instead of Dashboard */}
                <div className={styles.featureGrid}>
                    {features.map((f, i) => (
                        <motion.div
                            key={i}
                            initial={isTouch ? false : { opacity: 0, y: 40 }}
                            animate={isTouch ? false : { opacity: 1, y: 0 }}
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
