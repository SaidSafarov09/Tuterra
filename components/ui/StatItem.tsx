import React from 'react'
import styles from './StatItem.module.scss'
import Link from 'next/link'

interface StatItemProps {
    label: string
    value: string | number
    icon: any
    href: string
    onClick: () => void
}

export const StatItem: React.FC<StatItemProps> = ({ label, value, icon: Icon, href, onClick }) => {
    const content = (
        <div className={styles.statItem} onClick={() => setTimeout(onClick, 200)}>
            <div className={styles.statLabel}>
                <Icon size={16} />
                {label}
            </div>
            <div className={styles.statValue}>
                {value}
            </div>
        </div>
    )

    if (href) {
        return (
            <Link href={href} className={styles.link}>
                {content}
            </Link>
        )
    }
    return content;
}
