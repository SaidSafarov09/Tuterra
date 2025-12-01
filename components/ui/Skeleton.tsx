import React from 'react'
import styles from './Skeleton.module.scss'

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
    width?: string | number
    height?: string | number
    variant?: 'text' | 'circular' | 'rectangular'
    className?: string
}

export const Skeleton: React.FC<SkeletonProps> = ({
    width,
    height,
    variant = 'rectangular',
    className = '',
    style,
    ...props
}) => {
    const variantClass = variant === 'circular' ? styles.circle : ''

    return (
        <div
            className={`${styles.skeleton} ${variantClass} ${className}`}
            style={{
                width: width,
                height: height,
                ...style
            }}
            {...props}
        />
    )
}
