import React from 'react'
import styles from './CareerProgress.module.scss'
import { TrophyIcon, StarIcon, TrendingUpIcon, AwardIcon } from '@/components/icons/Icons'
import { motion } from 'framer-motion'
import { DashboardStats } from '@/types'

interface CareerProgressProps {
    stats: DashboardStats
}

export const CareerProgress: React.FC<CareerProgressProps> = ({ stats }) => {
    const totalLessons = stats.totalLessons || 0
    const studentsCount = stats.studentsCount || 0

    // Level logic
    const getLevelInfo = (count: number) => {
        if (count < 10) return { level: 1, name: 'Новичок', target: 10, nextLevel: 'Профи' }
        if (count < 50) return { level: 2, name: 'Профи', target: 50, nextLevel: 'Мастер' }
        if (count < 100) return { level: 3, name: 'Мастер', target: 100, nextLevel: 'Эксперт' }
        if (count < 500) return { level: 4, name: 'Эксперт', target: 500, nextLevel: 'Легенда' }
        return { level: 5, name: 'Легенда', target: 1000, nextLevel: 'Гуру' }
    }

    const levelInfo = getLevelInfo(totalLessons)
    const progress = Math.min((totalLessons / levelInfo.target) * 100, 100)
    const isNewAccount = totalLessons === 0 && studentsCount === 0


    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2 className={styles.title}>
                    <TrophyIcon size={20} className={styles.icon} />
                    Карьерный рост
                </h2>
                <div className={styles.badge}>
                    <AwardIcon size={120} />
                </div>
            </div>

            <div className={styles.grid}>
                <div className={styles.statItem}>
                    <span className={styles.statLabel}>Всего уроков</span>
                    <span className={styles.statValue}>{totalLessons}</span>
                    <span className={styles.statSubtext}>
                        <TrendingUpIcon size={14} />
                        +{stats.monthLessonsCount || 0} в этом месяце
                    </span>
                </div>
                {!isNewAccount ? (
                    <div className={styles.statItem}>
                        <span className={styles.statLabel}>Ваш рейтинг</span>
                        <span className={styles.statValue}>
                            Топ {stats.teacherRank || 1}
                        </span>
                        <span className={styles.statSubtext}>
                            среди всех преподавателей
                        </span>
                    </div>
                ) : (
                    <div className={styles.statItem}>
                        <span className={styles.statLabel}>Рейтинг</span>
                        <span className={styles.statValue} style={{ fontSize: '14px', whiteSpace: 'normal', lineHeight: '1.4', fontWeight: 400, opacity: 0.7 }}>
                            Начните работу в платформе, чтобы увидеть свой рейтинг
                        </span>
                    </div>
                )}
            </div>

            <div className={styles.milestones}>
                <div className={styles.milestoneHeader}>
                    <span className={styles.milestoneTitle}>
                        Уровень {levelInfo.level}: {levelInfo.name}
                    </span>
                    <span className={styles.milestoneTarget}>
                        {totalLessons} / {levelInfo.target} уроков
                    </span>
                </div>
                <div className={styles.progressBar}>
                    <motion.div
                        className={styles.progressFill}
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                    />
                </div>
                <div className={styles.currentLevel}>
                    <StarIcon size={14} color="#FACC15" />
                    <span>Следующая цель: {levelInfo.nextLevel}</span>
                </div>
            </div>
        </div>
    )

}
