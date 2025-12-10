import React from 'react'
import { Skeleton } from '@/components/ui/Skeleton'

export const GroupDetailSkeleton: React.FC = () => {
    return (
        <div style={{ maxWidth: '1000px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px' }}>
                <Skeleton width={100} height={40} />
                <div style={{ display: 'flex', gap: '12px' }}>
                    <Skeleton width={140} height={40} />
                    <Skeleton width={100} height={40} />
                </div>
            </div>

            <div style={{
                background: 'var(--surface)',
                borderRadius: '16px',
                padding: '32px',
                marginBottom: '32px',
                display: 'flex',
                gap: '24px'
            }}>
                <Skeleton variant="rectangular" width={80} height={80} style={{ borderRadius: '16px' }} />
                <div style={{ flex: 1 }}>
                    <Skeleton width="50%" height={32} style={{ marginBottom: '12px' }} />
                    <Skeleton width="30%" height={20} />
                </div>
            </div>

            <div style={{
                background: 'var(--surface)',
                borderRadius: '16px',
                padding: '24px',
                marginBottom: '24px'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <Skeleton width={120} height={24} />
                    <Skeleton width={180} height={36} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '12px' }}>
                    <Skeleton height={80} style={{ borderRadius: '12px' }} />
                    <Skeleton height={80} style={{ borderRadius: '12px' }} />
                    <Skeleton height={80} style={{ borderRadius: '12px' }} />
                </div>
            </div>

            <div style={{
                background: 'var(--surface)',
                borderRadius: '16px',
                padding: '24px'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <Skeleton width={160} height={24} />
                    <Skeleton width={160} height={36} />
                </div>
                <Skeleton width="100%" height={60} style={{ borderRadius: '8px' }} />
            </div>
        </div>
    )
}
