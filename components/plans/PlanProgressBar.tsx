import styles from './PlanProgressBar.module.scss'

interface PlanProgressBarProps {
    title: string
    total: number
    completed: number
    color?: string
}

export function PlanProgressBar({ title, total, completed, color = '#4A6CF7' }: PlanProgressBarProps) {
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0

    return (
        <div className={styles.container}>
            <div className={styles.bar} style={{ backgroundColor: color }} />
            <div className={styles.content}>
                <div className={styles.title}>{title}</div>
                <div className={styles.track}>
                    <div
                        className={styles.fill}
                        style={{
                            width: `${percentage}%`,
                            backgroundColor: color
                        }}
                    />
                </div>
            </div>
            <div className={styles.percentage} style={{ color }}>
                {percentage}%
            </div>
        </div>
    )
}
