import React from 'react'
import { Skeleton } from '@/components/ui/Skeleton'

export const LessonDetailSkeleton: React.FC = () => {
    return (
        <div style={{
            background: 'var(--background)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '32px',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px'
        }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <Skeleton width={200} height={32} />
                        <Skeleton width={100} height={24} style={{ borderRadius: '12px' }} />
                    </div>
                    <Skeleton width={250} height={16} />
                </div>
                <div style={{ textAlign: 'right' }}>
                    <Skeleton width={80} height={32} style={{ marginBottom: '8px', marginLeft: 'auto' }} />
                    <Skeleton width={100} height={24} style={{ borderRadius: '12px', marginLeft: 'auto' }} />
                </div>
            </div>

            {/* Content */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingTop: '24px', borderTop: '1px solid var(--border)' }}>
                <div>
                    <Skeleton width={120} height={20} style={{ marginBottom: '8px' }} />
                    <Skeleton width="80%" height={24} />
                </div>
                <div>
                    <Skeleton width={120} height={20} style={{ marginBottom: '8px' }} />
                    <Skeleton width="100%" height={80} />
                </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '12px', paddingTop: '24px', borderTop: '1px solid var(--border)' }}>
                <Skeleton width={120} height={40} style={{ borderRadius: '8px' }} />
                <Skeleton width={120} height={40} style={{ borderRadius: '8px' }} />
                <Skeleton width={120} height={40} style={{ borderRadius: '8px' }} />
                <Skeleton width={40} height={40} style={{ borderRadius: '8px', marginLeft: 'auto' }} />
            </div>
        </div>
    )
}
