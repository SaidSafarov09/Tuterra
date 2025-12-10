import React from 'react'
import { Skeleton } from '@/components/ui/Skeleton'

export const GroupCardSkeleton: React.FC = () => {
    return (
        <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
        }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                <Skeleton variant="rectangular" width={48} height={48} style={{ borderRadius: '12px' }} />
                <div style={{ flex: 1 }}>
                    <Skeleton width="70%" height={20} style={{ marginBottom: '8px' }} />
                    <Skeleton width="40%" height={16} />
                </div>
            </div>
            <div style={{ paddingTop: '12px', borderTop: '1px solid var(--border-light)' }}>
                <Skeleton width="50%" height={14} />
            </div>
        </div>
    )
}
