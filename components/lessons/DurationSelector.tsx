import React from 'react'
import { ChevronDownIcon } from '@/components/icons/Icons'
import styles from './DurationSelector.module.scss'

export const DURATION_OPTIONS = [
    { value: 30, label: '30 мин' },
    { value: 45, label: '45 мин' },
    { value: 60, label: '1 час' },
    { value: 90, label: '1,5 часа' },
    { value: 120, label: '2 часа' },
]

interface DurationSelectorProps {
    value: number
    onChange: (value: number) => void
    disabled?: boolean
}

export function DurationSelector({ value, onChange, disabled }: DurationSelectorProps) {
    const selectedOption = DURATION_OPTIONS.find(opt => opt.value === value) || DURATION_OPTIONS[2]

    return (
        <div className={styles.container}>
            <label className={styles.label}>Продолжительность</label>
            <div className={styles.selectWrapper}>
                <select
                    className={styles.select}
                    value={value}
                    onChange={(e) => onChange(Number(e.target.value))}
                    disabled={disabled}
                >
                    {DURATION_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
                <ChevronDownIcon size={16} className={styles.icon} />
            </div>
        </div>
    )
}
