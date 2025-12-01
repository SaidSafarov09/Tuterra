import React from 'react'
import { Skeleton } from '@/components/ui/Skeleton'

export const StudentCardSkeleton: React.FC = () => {
    return (
        <div style={{
            background: 'var(--background)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <Skeleton variant="circular" width={80} height={80} />
                <div style={{ flex: 1 }}>
                    <Skeleton width="60%" height={24} style={{ marginBottom: '8px' }} />
                    <Skeleton width="40%" height={16} />
                </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <Skeleton width="100%" height={40} style={{ borderRadius: '8px' }} />
                <Skeleton width="100%" height={40} style={{ borderRadius: '8px' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-around', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
                <div style={{ textAlign: 'center' }}>
                    <Skeleton width={40} height={20} style={{ marginBottom: '4px', marginLeft: 'auto', marginRight: 'auto' }} />
                    <Skeleton width={60} height={14} />
                </div>
                <div style={{ textAlign: 'center' }}>
                    <Skeleton width={40} height={20} style={{ marginBottom: '4px', marginLeft: 'auto', marginRight: 'auto' }} />
                    <Skeleton width={60} height={14} />
                </div>
            </div>
        </div>
    )
}
