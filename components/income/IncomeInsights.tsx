import React from 'react'
import styles from './IncomeInsights.module.scss'
import {
    AnalyticsIcon,
    ChevronRightIcon,
    CalendarIcon,
    MessageIcon,
    TrendingUpIcon,
} from '@/components/icons/Icons'

interface Insight {
    id: string
    type: 'schedule' | 'retention' | 'income'
    title: string
    text: string
    icon: string
    color: string
    studentId?: string
    studentPhone?: string
}

interface IncomeInsightsProps {
    insights: Insight[]
}

export const IncomeInsights: React.FC<IncomeInsightsProps> = ({ insights }) => {
    if (!insights || insights.length === 0) return null

    const getIcon = (iconName: string) => {
        switch (iconName) {
            case 'calendar': return <CalendarIcon size={20} />
            case 'message': return <MessageIcon size={20} />
            case 'trending': return <TrendingUpIcon size={20} />
            default: return <AnalyticsIcon size={20} />
        }
    }

    const handleAction = (insight: Insight) => {
        if (insight.type === 'retention' && insight.studentPhone) {
            const phone = insight.studentPhone.replace(/[^\d]/g, '')
            window.open(`https://wa.me/${phone}`, '_blank')
        }
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2 className={styles.title}>
                    <AnalyticsIcon size={20} className={styles.icon} />
                    Умная аналитика
                </h2>
                <div className={styles.proBadge}>PRO</div>
            </div>

            <div className={styles.insightsList}>
                {insights.map((insight) => {
                    const isActionable = insight.type === 'retention'

                    return (
                        <div
                            key={insight.id}
                            className={`${styles.insightItem} ${!isActionable ? styles.nonClickable : ''}`}
                            onClick={isActionable ? () => handleAction(insight) : undefined}
                        >
                            <div className={`${styles.insightIcon} ${styles[insight.color]}`}>
                                {getIcon(insight.icon)}
                            </div>
                            <div className={styles.insightContent}>
                                <div className={styles.insightTitle}>{insight.title}</div>
                                <div className={styles.insightText}>{insight.text}</div>
                            </div>
                            {insight.type === 'retention' ? (
                                <button className={styles.contactBtn}>
                                    Написать
                                </button>
                            ) : null}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
