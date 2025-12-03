import React from 'react'
import { WalletIcon } from '@/components/icons/Icons'
import styles from './EmptyState.module.scss'

interface EmptyStateProps {
    title: string
    description?: React.ReactNode
    icon?: React.ReactNode
}

export const EmptyState: React.FC<EmptyStateProps> = ({
    title,
    description,
    icon
}) => {
    return (
        <div className={styles.container}>
            <div className={styles.iconWrapper}>
                {icon}
            </div>
            <h2 className={styles.title}>{title}</h2>
            {description && (
                <p className={styles.description}>
                    {typeof description === 'string'
                        ? description.split('\n').map((line, i) => (
                            <React.Fragment key={i}>
                                {line}
                                {i < description.split('\n').length - 1 && <br />}
                            </React.Fragment>
                        ))
                        : description
                    }
                </p>
            )}
        </div>
    )
}
