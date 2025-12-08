import React from 'react'
import styles from './Button.module.scss'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
    size?: 'small' | 'medium' | 'large'
    fullWidth?: boolean
    isLoading?: boolean
    children: React.ReactNode
}

export const Button: React.FC<ButtonProps> = ({
    variant = 'primary',
    size = 'medium',
    fullWidth = false,
    isLoading = false,
    children,
    className = '',
    disabled,
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
        <button
            className={classNames}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                    <span className={styles.spinner} style={{
                        width: '16px',
                        height: '16px',
                        border: '2px solid currentColor',
                        borderRightColor: 'transparent',
                        borderRadius: '50%',
                        animation: 'spin 0.75s linear infinite',
                        display: 'inline-block'
                    }} />
                    {children}
                </span>
            ) : children}
        </button>
    )
}
