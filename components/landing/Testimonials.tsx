'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Quote, Star, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react'
import styles from './Testimonials.module.scss'

const testimonials = [
    {
        name: 'Елена Соколова',
        role: 'Преподаватель английского',
        content: 'Наконец-то я избавилась от бумажных блокнотов и бесконечных таблиц. Теперь всё расписание и статус оплат всегда под рукой.',
        avatar: 'ЕС',
        color: '#4A6CF7'
    },
    {
        name: 'Артем Волков',
        role: 'Репетитор математики (ЕГЭ)',
        content: 'Очень удобная мобильная версия. Теперь могу отметить проведенный урок или проверить оплату прямо с телефона между занятиями.',
        avatar: 'АВ',
        color: '#10B981'
    },
    {
        name: 'Анна Кравцова',
        role: 'Основатель студии',
        content: 'Долго искали простую систему для учета. В Tuterra нет ничего лишнего, всё понятно с первого дня использования.',
        avatar: 'АК',
        color: '#F59E0B'
    },
    {
        name: 'Дмитрий Ларин',
        role: 'Эксперт по физике',
        content: 'Учет оплат — самая полезная функция. Больше не нужно вспоминать, кто заплатил, а кто нет — система наглядно всё показывает сама.',
        avatar: 'ДЛ',
        color: '#8B5CF6'
    }
]

export const Testimonials = () => {
    const [index, setIndex] = useState(0)

    const next = () => {
        setIndex((prev) => (prev + 1) % (testimonials.length - 2))
    }

    const prev = () => {
        setIndex((prev) => (prev - 1 + (testimonials.length - 2)) % (testimonials.length - 2))
    }

    return (
        <section id="testimonials" className={styles.section}>
            <div className={styles.glow} />

            <div className={styles.container}>
                <div className={styles.header}>
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className={styles.badge}
                    >
                        <Sparkles size={16} /> Реальный опыт
                    </motion.div>
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className={styles.title}
                    >
                        Что говорят <span>преподаватели</span>
                    </motion.h2>
                </div>

                <div className={styles.sliderWrapper}>
                    <div className={styles.sliderTrack} style={{ transform: `translateX(-${index * (100 / 3)}%)` }}>
                        {testimonials.map((t, i) => (
                            <div key={i} className={styles.slide}>
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    whileInView={{ opacity: 1, scale: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.1 }}
                                    className={styles.card}
                                    style={{ '--accent-color': t.color } as any}
                                >
                                    <Quote size={40} className={styles.quoteIcon} />

                                    <div className={styles.stars}>
                                        {[1, 2, 3, 4, 5].map(v => (
                                            <Star key={v} size={14} fill="#F59E0B" color="#F59E0B" />
                                        ))}
                                    </div>

                                    <p className={styles.quote}>
                                        «{t.content}»
                                    </p>

                                    <div className={styles.author}>
                                        <div className={styles.avatar} style={{ background: t.color }}>
                                            {t.avatar}
                                        </div>
                                        <div className={styles.authorInfo}>
                                            <div className={styles.name}>{t.name}</div>
                                            <div className={styles.role}>{t.role}</div>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        ))}
                    </div>

                    <div className={styles.controls}>
                        <button onClick={prev} className={styles.controlBtn}>
                            <ChevronLeft size={24} />
                        </button>
                        <button onClick={next} className={styles.controlBtn}>
                            <ChevronRight size={24} />
                        </button>
                    </div>
                </div>
            </div>
        </section>
    )
}
