import React from 'react'
import { Checkbox } from '@/components/ui/Checkbox'

interface TrialToggleProps {
    isTrial: boolean
    onChange: (isTrial: boolean) => void
    disabled?: boolean
}

export function TrialToggle({ isTrial, onChange, disabled }: TrialToggleProps) {
    return (
        <div style={{ marginBottom: '12px' }}>
            <Checkbox
                checked={isTrial}
                onChange={(e) => onChange(e.target.checked)}
                label="Пробный урок (бесплатно)"
                disabled={disabled}
            />
        </div>
    )
}
