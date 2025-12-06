import React from 'react'
import { Skeleton } from '@/components/ui/Skeleton'

export const CalendarSkeleton: React.FC = () => {
    return (
        <div style={{
            background: 'var(--background)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
        }}>
            {/* Month navigation */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                <Skeleton width={40} height={40} style={{ borderRadius: '8px' }} />
                <Skeleton width={150} height={32} />
                <Skeleton width={40} height={40} style={{ borderRadius: '8px' }} />
            </div>

            {/* Week days */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '8px' }}>
                {Array.from({ length: 7 }).map((_, i) => (
                    <Skeleton key={i} width="100%" height={24} />
                ))}
            </div>

            {/* Calendar grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
                {Array.from({ length: 35 }).map((_, i) => (
                    <div key={i} style={{
                        aspectRatio: '1',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                        padding: '4px',
                        border: '1px solid var(--border)',
                        borderRadius: '8px'
                    }}>
                        <Skeleton width={24} height={20} />
                        <Skeleton width="100%" height={4} style={{ marginTop: 'auto' }} />
                    </div>
                ))}
            </div>
        </div>
    )
}
