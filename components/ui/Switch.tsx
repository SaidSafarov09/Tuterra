'use client'

import React from 'react'
import styles from './Switch.module.scss'

interface SwitchProps {
    checked: boolean
    onChange: (checked: boolean) => void
    label?: string
    disabled?: boolean
}

export const Switch: React.FC<SwitchProps> = ({ checked, onChange, label, disabled }) => {
    return (
        <label className={`${styles.switchContainer} ${disabled ? styles.disabled : ''}`}>
            {label && <span className={styles.label}>{label}</span>}
            <div className={styles.switchWrapper}>
                <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => onChange(e.target.checked)}
                    disabled={disabled}
                    className={styles.input}
                />
                <div className={`${styles.slider} ${checked ? styles.checked : ''}`} />
            </div>
        </label>
    )
}
