import React from 'react'
import { Skeleton } from '@/components/ui/Skeleton'

export const SubjectCardSkeleton: React.FC = () => {
    return (
        <div style={{
            background: 'var(--background)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Skeleton variant="circular" width={48} height={48} />
                <Skeleton width="50%" height={20} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-around', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
                <div style={{ textAlign: 'center' }}>
                    <Skeleton width={30} height={24} style={{ marginBottom: '4px', marginLeft: 'auto', marginRight: 'auto' }} />
                    <Skeleton width={80} height={14} />
                </div>
                <div style={{ textAlign: 'center' }}>
                    <Skeleton width={30} height={24} style={{ marginBottom: '4px', marginLeft: 'auto', marginRight: 'auto' }} />
                    <Skeleton width={80} height={14} />
                </div>
            </div>
        </div>
    )
}
