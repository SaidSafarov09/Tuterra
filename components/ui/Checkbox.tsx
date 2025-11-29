import React from 'react'
import styles from './Checkbox.module.scss'
import { CheckIcon } from '@/components/icons/Icons'

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string
}

export function Checkbox({ label, className = '', ...props }: CheckboxProps) {
    return (
        <label className={`${styles.container} ${className}`}>
            <div className={styles.inputWrapper}>
                <input type="checkbox" className={styles.input} {...props} />
                <div className={styles.checkmark}>
                    <CheckIcon size={12} />
                </div>
            </div>
            {label && <span className={styles.label}>{label}</span>}
        </label>
    )
}
