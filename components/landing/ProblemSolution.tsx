'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { X, Check, Zap, Sparkles } from 'lucide-react'
import styles from './ProblemSolution.module.scss'

export const ProblemSolution = () => {
    return (
        <section className={styles.section}>
            <div className={styles.container}>
                <div className={styles.header}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className={styles.badge}
                    >
                        Хватит тратить время на рутину
                    </motion.div>
                    <h2 className={styles.title}>
                        Как это с Tuterra <br />
                        <span>и без неё</span>
                    </h2>
                </div>

                <div className={styles.grid}>
                    {/* Chaos Side */}
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className={`${styles.side} ${styles.sideLeft}`}
                    >
                        <div className={styles.bgIcon}>
                            <X size={120} color="#EF4444" />
                        </div>
                        <h3 className={styles.sideTitle}>Работа без системы</h3>

                        <div className={styles.list}>
                            {[
                                { t: 'Google Таблицы', d: 'Сотни строк, в которых легко запутаться или случайно удалить данные.' },
                                { t: 'Мессенджеры', d: 'Переписки с родителями теряются среди личных чатов, оплаты трудно отследить.' },
                                { t: 'Лишняя нагрузка', d: 'Приходится постоянно держать в голове, кто записан и кто еще не оплатил.' }
                            ].map((item, i) => (
                                <div key={i} className={styles.item}>
                                    <div className={styles.iconCircle} style={{ background: '#FEE2E2' }}>
                                        <X size={16} color="#EF4444" strokeWidth={3} />
                                    </div>
                                    <div>
                                        <div className={styles.itemTitle} style={{ color: '#1A1A1A' }}>{item.t}</div>
                                        <div className={styles.itemDesc} style={{ color: '#6B7280' }}>{item.d}</div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className={`${styles.preview} ${styles.previewLeft}`}>
                            <div style={{ fontSize: '13px', fontWeight: 700, color: '#EF4444', marginBottom: '12px' }}>БЕЗ СИСТЕМЫ:</div>
                            <div style={{ height: '8px', width: '80%', background: '#F3F4F6', borderRadius: '4px', marginBottom: '8px' }} />
                            <div style={{ height: '8px', width: '50%', background: '#F3F4F6', borderRadius: '4px' }} />
                        </div>
                    </motion.div>

                    {/* Tuterra Side */}
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className={`${styles.side} ${styles.sideRight}`}
                    >
                        <div className={styles.bgIcon} style={{ opacity: 0.15 }}>
                            <Sparkles size={120} color="#FFFFFF" />
                        </div>
                        <h3 className={styles.sideTitle}>Порядок с Tuterra</h3>

                        <div className={styles.list}>
                            {[
                                { t: 'Понятный календарь', d: 'Все занятия в одном окне. Наглядно, просто и с автоматическими напоминаниями.' },
                                { t: 'Учет оплат', d: 'Система сама считает доход, показывает долги и сохраняет историю каждого платежа.' },
                                { t: 'Данные учеников', d: 'История занятий и пройденные темы для каждого ученика сохранены навсегда.' }
                            ].map((item, i) => (
                                <div key={i} className={styles.item}>
                                    <div className={styles.iconCircle} style={{ background: 'rgba(255,255,255,0.2)' }}>
                                        <Check size={16} color="#FFFFFF" strokeWidth={3} />
                                    </div>
                                    <div>
                                        <div className={styles.itemTitle}>{item.t}</div>
                                        <div className={styles.itemDesc} style={{ color: 'rgba(255,255,255,0.8)' }}>{item.d}</div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className={`${styles.preview} ${styles.previewRight}`}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', alignItems: 'center' }}>
                                <div style={{ fontSize: '14px', fontWeight: 700 }}>Доход за месяц</div>
                                <div style={{ fontSize: '20px', fontWeight: 800 }}>+45%</div>
                            </div>
                            <div style={{ height: '8px', background: 'rgba(255,255,255,0.2)', borderRadius: '4px' }}>
                                <div style={{ height: '100%', width: '100%', background: '#FFFFFF', borderRadius: '4px' }} />
                            </div>
                        </div>
                    </motion.div>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className={styles.footer}
                >
                    <div className={styles.footerBadge}>
                        <Zap size={20} color="#4A6CF7" fill="#4A6CF7" />
                        <span>В 2.5 раза меньше времени на административные задачи</span>
                    </div>
                </motion.div>
            </div>
        </section>
    )
}
