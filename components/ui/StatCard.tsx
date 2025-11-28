import React from 'react'
import Link from 'next/link'
import styles from './StatCard.module.scss'

interface StatCardProps {
    icon: React.ReactNode
    label: string
    value: string | number
    href?: string
}

export const StatCard: React.FC<StatCardProps> = ({ icon, label, value, href }) => {
    const content = (
        <div className={styles.card}>
            <div className={styles.icon}>{icon}</div>
            <p className={styles.label}>{label}</p>
            <h2 className={styles.value}>{value}</h2>
        </div>
    )

    if (href) {
        return (
            <Link href={href} className={styles.link}>
                {content}
            </Link>
        )
    }

    return content
}
