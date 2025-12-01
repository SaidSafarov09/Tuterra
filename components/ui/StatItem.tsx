import React from 'react'
import styles from './StatItem.module.scss'
import Link from 'next/link'

interface StatItemProps {
    label: string
    value: React.ReactNode
    icon: any
    href?: string
    onClick?: () => void
}

export const StatItem: React.FC<StatItemProps> = ({ label, value, icon: Icon, href, onClick }) => {
    const handleClick = () => {
        if (onClick) {
            setTimeout(onClick, 200)
        }
    }

    const content = (
        <div className={styles.statItem} onClick={handleClick}>
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
