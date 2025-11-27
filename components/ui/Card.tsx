import React from 'react'
import styles from './Card.module.scss'

interface CardProps {
    children: React.ReactNode
    clickable?: boolean
    onClick?: () => void
    className?: string
}

export const Card: React.FC<CardProps> = ({
    children,
    clickable = false,
    onClick,
    className = '',
}) => {
    const classNames = [
        styles.card,
        clickable && styles.cardClickable,
        className,
    ]
        .filter(Boolean)
        .join(' ')

    return (
        <div className={classNames} onClick={onClick}>
            {children}
        </div>
    )
}

interface CardHeaderProps {
    title: string
    description?: string
}

export const CardHeader: React.FC<CardHeaderProps> = ({ title, description }) => {
    return (
        <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>{title}</h3>
            {description && <p className={styles.cardDescription}>{description}</p>}
        </div>
    )
}

interface CardContentProps {
    children: React.ReactNode
}

export const CardContent: React.FC<CardContentProps> = ({ children }) => {
    return <div className={styles.cardContent}>{children}</div>
}

interface CardFooterProps {
    children: React.ReactNode
}

export const CardFooter: React.FC<CardFooterProps> = ({ children }) => {
    return <div className={styles.cardFooter}>{children}</div>
}
