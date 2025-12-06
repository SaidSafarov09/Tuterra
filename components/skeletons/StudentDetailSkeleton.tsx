import React from 'react'
import { Skeleton } from '@/components/ui/Skeleton'

export const StudentDetailSkeleton: React.FC = () => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Header */}
            <div style={{
                background: 'var(--background)',
                border: '1px solid var(--border)',
                borderRadius: '16px',
                padding: '24px',
                display: 'flex',
                alignItems: 'center',
                gap: '24px',
                flexWrap: 'wrap'
            }}>
                <Skeleton variant="circular" width={100} height={100} />
                <div style={{ flex: 1 }}>
                    <Skeleton width={200} height={32} style={{ marginBottom: '8px' }} />
                    <Skeleton width={150} height={16} style={{ marginBottom: '16px' }} />
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <Skeleton width={100} height={24} style={{ borderRadius: '12px' }} />
                        <Skeleton width={100} height={24} style={{ borderRadius: '12px' }} />
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <Skeleton width={40} height={40} style={{ borderRadius: '8px' }} />
                    <Skeleton width={40} height={40} style={{ borderRadius: '8px' }} />
                </div>
            </div>

            {/* Subjects */}
            <div style={{
                background: 'var(--background)',
                border: '1px solid var(--border)',
                borderRadius: '16px',
                padding: '24px'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <Skeleton width={150} height={24} />
                    <Skeleton width={120} height={32} style={{ borderRadius: '8px' }} />
                </div>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <Skeleton width={120} height={40} style={{ borderRadius: '20px' }} />
                    <Skeleton width={120} height={40} style={{ borderRadius: '20px' }} />
                    <Skeleton width={120} height={40} style={{ borderRadius: '20px' }} />
                </div>
            </div>

            {/* Lessons */}
            <div style={{
                background: 'var(--background)',
                border: '1px solid var(--border)',
                borderRadius: '16px',
                padding: '24px'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <Skeleton width={150} height={24} />
                    <Skeleton width={150} height={32} style={{ borderRadius: '8px' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <Skeleton width="100%" height={80} style={{ borderRadius: '12px' }} />
                    <Skeleton width="100%" height={80} style={{ borderRadius: '12px' }} />
                    <Skeleton width="100%" height={80} style={{ borderRadius: '12px' }} />
                </div>
            </div>
        </div>
    )
}
