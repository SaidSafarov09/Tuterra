'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import { Quote, Star, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react'
import styles from './Testimonials.module.scss'
import { testimonials } from '@/constants/landing'
import { useMediaQuery } from '@/hooks/useMediaQuery'

export const Testimonials = () => {
    const isTouch = useMediaQuery('(pointer: coarse)')
    const isTablet = useMediaQuery('(max-width: 1100px)')
    const [index, setIndex] = useState(0)
    const scrollRef = useRef<HTMLDivElement>(null)

    const slidesPerRow = isTouch ? 1 : isTablet ? 2 : 3
    const maxIndex = testimonials.length - slidesPerRow

    // Reset index on resize
    useEffect(() => {
        if (index > maxIndex) setIndex(maxIndex)
    }, [maxIndex, index])

    const next = () => {
        setIndex((prev) => (prev >= maxIndex ? 0 : prev + 1))
    }

    const prev = () => {
        setIndex((prev) => (prev <= 0 ? maxIndex : prev - 1))
    }

    // Если это тач-устройство, используем нативный скролл через CSS
    if (isTouch) {
        return (
            <section id="testimonials" className={styles.section}>
                <div className={styles.container}>
                    <div className={styles.header}>
                        <div className={styles.badge}>
                            <Sparkles size={16} /> Реальный опыт
                        </div>
                        <h2 className={styles.title}>
                            Что говорят <span>преподаватели</span>
                        </h2>
                    </div>

                    <div className={styles.mobileScrollContainer} ref={scrollRef}>
                        {testimonials.map((t, i) => (
                            <div key={i} className={styles.mobileSlide}>
                                <div
                                    className={styles.card}
                                    style={{ '--accent-color': t.color } as any}
                                >
                                    <Quote size={32} className={styles.quoteIcon} />
                                    <div className={styles.stars}>
                                        {[1, 2, 3, 4, 5].map(v => (
                                            <Star key={v} size={14} fill="#F59E0B" color="#F59E0B" />
                                        ))}
                                    </div>
                                    <p className={styles.quote}>«{t.content}»</p>
                                    <div className={styles.author}>
                                        <div className={styles.avatar} style={{ background: t.color }}>
                                            {t.avatar}
                                        </div>
                                        <div className={styles.authorInfo}>
                                            <div className={styles.name}>{t.name}</div>
                                            <div className={styles.role}>{t.role}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className={styles.swipeHint}>Листайте вправо →</div>
                </div>
            </section>
        )
    }

    // Для десктопа оставляем интерактивный слайдер с анимациями
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
                    <motion.div
                        className={styles.sliderTrack}
                        animate={{ x: `-${index * (100 / slidesPerRow)}%` }}
                        transition={{ type: 'spring', damping: 25, stiffness: 120 }}
                    >
                        {testimonials.map((t, i) => (
                            <div key={i} className={styles.slide}>
                                <div
                                    className={styles.card}
                                    style={{ '--accent-color': t.color } as any}
                                >
                                    <Quote size={40} className={styles.quoteIcon} />
                                    <div className={styles.stars}>
                                        {[1, 2, 3, 4, 5].map(v => (
                                            <Star key={v} size={14} fill="#F59E0B" color="#F59E0B" />
                                        ))}
                                    </div>
                                    <p className={styles.quote}>«{t.content}»</p>
                                    <div className={styles.author}>
                                        <div className={styles.avatar} style={{ background: t.color }}>
                                            {t.avatar}
                                        </div>
                                        <div className={styles.authorInfo}>
                                            <div className={styles.name}>{t.name}</div>
                                            <div className={styles.role}>{t.role}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </motion.div>

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
