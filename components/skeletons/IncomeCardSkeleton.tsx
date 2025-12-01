import React from 'react'
import { Skeleton } from '@/components/ui/Skeleton'

export const IncomeCardSkeleton: React.FC = () => {
    return (
        <div style={{
            background: 'var(--background)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
        }}>
            <Skeleton width="40%" height={14} />
            <Skeleton width="60%" height={36} />
            <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
                <div style={{ flex: 1 }}>
                    <Skeleton width="100%" height={12} style={{ marginBottom: '4px' }} />
                    <Skeleton width="60%" height={16} />
                </div>
                <div style={{ flex: 1 }}>
                    <Skeleton width="100%" height={12} style={{ marginBottom: '4px' }} />
                    <Skeleton width="60%" height={16} />
                </div>
            </div>
        </div>
    )
}
