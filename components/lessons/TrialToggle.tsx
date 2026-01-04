import React from 'react'
import { Checkbox } from '@/components/ui/Checkbox'

interface TrialToggleProps {
    isTrial: boolean
    onChange: (isTrial: boolean) => void
    disabled?: boolean
    label?: string
    subtitle?: string
}

export function TrialToggle({ isTrial, onChange, disabled, label = "Пробный урок", subtitle }: TrialToggleProps) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <Checkbox
                checked={isTrial}
                onChange={(e) => onChange(e.target.checked)}
                label={label}
                disabled={disabled}
            />
            {subtitle && (
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', marginLeft: '32px' }}>
                    {subtitle}
                </span>
            )}
        </div>
    )
}
