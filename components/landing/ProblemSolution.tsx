'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { X, Check, Zap, Sparkles } from 'lucide-react'
import styles from './ProblemSolution.module.scss'
import { useMediaQuery } from '@/hooks/useMediaQuery'

export const ProblemSolution = () => {
    const isTouch = useMediaQuery('(pointer: coarse)')
    const MotionDiv = isTouch ? 'div' : motion.div;

    return (
        <section className={styles.section}>
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
                        Меньше хаоса - больше учеников
                    </MotionDiv>
                    <h2 className={styles.title}>
                        Как выглядит работа репетитора<br />
                        с <span className={styles.gradientText}>системой</span> и без неё
                    </h2>
                </div>

                <div className={styles.grid}>
                    {/* Chaos Side */}
                    <MotionDiv
                        {...(isTouch ? {} : {
                            initial: { opacity: 0, x: -50 },
                            whileInView: { opacity: 1, x: 0 },
                            viewport: { once: true }
                        })}
                        className={`${styles.side} ${styles.sideLeft}`}
                    >
                        <div className={styles.bgIcon}>
                            <X size={120} color="#EF4444" />
                        </div>
                        <h3 className={styles.sideTitle}>Работа без системы</h3>

                        <div className={styles.list}>
                            {[
                                {
                                    t: 'Таблицы и заметки',
                                    d: 'Разрозненные файлы, которые со временем превращаются в кашу и требуют постоянной перепроверки.'
                                },
                                {
                                    t: 'Чаты и переписки',
                                    d: 'Договорённости теряются, оплаты путаются, важные сообщения приходится искать вручную.'
                                },
                                {
                                    t: 'Постоянное напряжение',
                                    d: 'Нужно помнить расписание, долги и переносы - система отсутствует, всё на вас.'
                                }
                            ].map((item, i) => (
                                <div key={i} className={styles.item}>
                                    <div className={styles.iconCircle} style={{ background: '#FEE2E2' }}>
                                        <X size={16} color="#EF4444" strokeWidth={3} />
                                    </div>
                                    <div>
                                        <div className={styles.itemTitle}>{item.t}</div>
                                        <div className={styles.itemDesc}>{item.d}</div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className={`${styles.preview} ${styles.previewLeft}`}>
                            <div style={{ fontSize: '13px', fontWeight: 700, color: '#EF4444', marginBottom: '12px' }}>БЕЗ СИСТЕМЫ:</div>
                            <div style={{ height: '8px', width: '80%', background: '#F3F4F6', borderRadius: '4px', marginBottom: '8px' }} />
                            <div style={{ height: '8px', width: '50%', background: '#F3F4F6', borderRadius: '4px' }} />
                        </div>
                    </MotionDiv>

                    {/* Tuterra Side */}
                    <MotionDiv
                        {...(isTouch ? {} : {
                            initial: { opacity: 0, x: 50 },
                            whileInView: { opacity: 1, x: 0 },
                            viewport: { once: true }
                        })}
                        className={`${styles.side} ${styles.sideRight}`}
                    >
                        <div className={styles.bgIcon} style={{ opacity: 0.15 }}>
                            <Sparkles size={120} color="#FFFFFF" />
                        </div>
                        <h3 className={styles.sideTitle}>Работа по системе</h3>

                        <div className={styles.list}>
                            {[
                                {
                                    t: 'Единый календарь',
                                    d: 'Все занятия, переносы и выходные - в одном наглядном расписании без накладок.'
                                },
                                {
                                    t: 'Прозрачные финансы',
                                    d: 'Доходы, долги и история оплат считаются автоматически и всегда под рукой.'
                                },
                                {
                                    t: 'Карточки учеников',
                                    d: 'Контакты, история занятий и прогресс - ничего не теряется и не забывается.'
                                }
                            ].map((item, i) => (
                                <div key={i} className={styles.item}>
                                    <div className={styles.iconCircle} style={{ background: 'rgba(255,255,255,0.2)' }}>
                                        <Check size={16} color="#FFFFFF" strokeWidth={3} />
                                    </div>
                                    <div>
                                        <div className={styles.itemTitle}>{item.t}</div>
                                        <div className={styles.itemDesc}>{item.d}</div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className={`${styles.preview} ${styles.previewRight}`}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', alignItems: 'center' }}>
                                <div style={{ fontSize: '14px', fontWeight: 700 }}>Финансы за месяц</div>
                                <div style={{ fontSize: '20px', fontWeight: 800 }}>+45%</div>
                            </div>
                            <div style={{ height: '8px', background: 'rgba(255,255,255,0.2)', borderRadius: '4px' }}>
                                <div style={{ height: '100%', width: '100%', background: '#FFFFFF', borderRadius: '4px' }} />
                            </div>
                        </div>
                    </MotionDiv>
                </div>

                <MotionDiv
                    {...(isTouch ? {} : {
                        initial: { opacity: 0, y: 30 },
                        whileInView: { opacity: 1, y: 0 },
                        viewport: { once: true }
                    })}
                    className={styles.footer}
                >
                    <div className={styles.footerBadge}>
                        <Zap size={20} color="#4A6CF7" fill="#4A6CF7" />
                        <span>Система, которая экономит часы каждую неделю</span>
                    </div>
                </MotionDiv>
            </div>
        </section>
    )
}
