import React from 'react'
import Link from 'next/link'
import styles from './Section.module.scss'

interface SectionProps {
    title: string
    viewAllHref?: string
    viewAllText?: string
    children: React.ReactNode
}

export const Section: React.FC<SectionProps> = ({
    title,
    viewAllHref,
    viewAllText = 'Смотреть все →',
    children,
}) => {
    return (
        <div className={styles.section}>
            <div className={styles.header}>
                <h3 className={styles.title}>{title}</h3>
                {viewAllHref && (
                    <Link href={viewAllHref} className={styles.viewAll}>
                        {viewAllText}
                    </Link>
                )}
            </div>
            <div className={styles.content}>{children}</div>
        </div>
    )
}
