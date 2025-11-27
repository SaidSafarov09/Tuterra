import React from 'react'
import styles from './Input.module.scss'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string
    error?: string
    hint?: string
    required?: boolean
}

export const Input: React.FC<InputProps> = ({
    label,
    error,
    hint,
    required,
    className = '',
    ...props
}) => {
    return (
        <div className={styles.inputGroup}>
            {label && (
                <label className={styles.label}>
                    {label}
                    {required && <span className={styles.required}>*</span>}
                </label>
            )}
            <input
                className={`${styles.input} ${error ? styles.error : ''} ${className}`}
                {...props}
            />
            {error && <span className={styles.errorMessage}>{error}</span>}
            {hint && !error && <span className={styles.hint}>{hint}</span>}
        </div>
    )
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string
    error?: string
    hint?: string
    required?: boolean
}

export const Textarea: React.FC<TextareaProps> = ({
    label,
    error,
    hint,
    required,
    className = '',
    ...props
}) => {
    return (
        <div className={styles.inputGroup}>
            {label && (
                <label className={styles.label}>
                    {label}
                    {required && <span className={styles.required}>*</span>}
                </label>
            )}
            <textarea
                className={`${styles.textarea} ${error ? styles.error : ''} ${className}`}
                {...props}
            />
            {error && <span className={styles.errorMessage}>{error}</span>}
            {hint && !error && <span className={styles.hint}>{hint}</span>}
        </div>
    )
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string
    error?: string
    hint?: string
    required?: boolean
    children: React.ReactNode
}

export const Select: React.FC<SelectProps> = ({
    label,
    error,
    hint,
    required,
    className = '',
    children,
    ...props
}) => {
    return (
        <div className={styles.inputGroup}>
            {label && (
                <label className={styles.label}>
                    {label}
                    {required && <span className={styles.required}>*</span>}
                </label>
            )}
            <select
                className={`${styles.select} ${error ? styles.error : ''} ${className}`}
                {...props}
            >
                {children}
            </select>
            {error && <span className={styles.errorMessage}>{error}</span>}
            {hint && !error && <span className={styles.hint}>{hint}</span>}
        </div>
    )
}
