import React from 'react'
import styles from './Button.module.scss'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
    size?: 'small' | 'medium' | 'large'
    fullWidth?: boolean
    children: React.ReactNode
}

export const Button: React.FC<ButtonProps> = ({
    variant = 'primary',
    size = 'medium',
    fullWidth = false,
    children,
    className = '',
    ...props
}) => {
    const classNames = [
        styles.button,
        styles[variant],
        size !== 'medium' && styles[size],
        fullWidth && styles.fullWidth,
        className,
    ]
        .filter(Boolean)
        .join(' ')

    return (
        <button className={classNames} {...props}>
            {children}
        </button>
    )
}
