import React from 'react'
import { Skeleton } from '@/components/ui/Skeleton'

export const StatCardSkeleton: React.FC = () => {
    return (
        <div style={{
            background: 'var(--background)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            cursor: 'pointer'
        }}>
            <Skeleton variant="circular" width={48} height={48} />
            <div style={{ flex: 1 }}>
                <Skeleton width="60%" height={14} style={{ marginBottom: '8px' }} />
                <Skeleton width="40%" height={28} />
            </div>
        </div>
    )
}
