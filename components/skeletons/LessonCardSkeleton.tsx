import React from 'react'
import { Skeleton } from '@/components/ui/Skeleton'

interface LessonCardSkeletonProps {
    variant?: 'default' | 'compact'
}

export const LessonCardSkeleton: React.FC<LessonCardSkeletonProps> = ({ variant = 'default' }) => {
    return (
        <div style={{
            background: 'var(--background)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: variant === 'compact' ? '16px' : '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Skeleton width="50%" height={20} />
                <Skeleton width={60} height={24} style={{ borderRadius: '12px' }} />
            </div>
            <div>
                <Skeleton width="70%" height={16} style={{ marginBottom: '8px' }} />
                <Skeleton width="40%" height={16} />
            </div>
            {variant !== 'compact' && (
                <div style={{ display: 'flex', gap: '8px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
                    <Skeleton width={80} height={32} style={{ borderRadius: '8px' }} />
                    <Skeleton width={80} height={32} style={{ borderRadius: '8px' }} />
                </div>
            )}
        </div>
    )
}
