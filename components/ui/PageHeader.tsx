import React from 'react'
import styles from './PageHeader.module.scss'

interface PageHeaderProps {
    title: string
    subtitle?: string
    action?: React.ReactNode
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, action }) => {
    return (
        <div className={styles.header}>
            <div className={styles.text}>
                <h1 className={styles.title}>{title}</h1>
                {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
            </div>
            {action && <div className={styles.action}>{action}</div>}
        </div>
    )
}
