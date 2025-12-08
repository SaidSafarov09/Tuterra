import React from 'react'
import { Skeleton } from '@/components/ui/Skeleton'

export const SettingsFormSkeleton: React.FC = () => {
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
            {}
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px', paddingBottom: '24px', borderBottom: '1px solid var(--border)' }}>
                <Skeleton variant="circular" width={100} height={100} />
                <div style={{ flex: 1 }}>
                    <Skeleton width="40%" height={20} style={{ marginBottom: '8px' }} />
                    <Skeleton width="60%" height={14} />
                </div>
            </div>

            {}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                    <Skeleton width={80} height={14} style={{ marginBottom: '8px' }} />
                    <Skeleton width="100%" height={44} style={{ borderRadius: '8px' }} />
                </div>
                <div>
                    <Skeleton width={80} height={14} style={{ marginBottom: '8px' }} />
                    <Skeleton width="100%" height={44} style={{ borderRadius: '8px' }} />
                </div>
                <div>
                    <Skeleton width={80} height={14} style={{ marginBottom: '8px' }} />
                    <Skeleton width="100%" height={44} style={{ borderRadius: '8px' }} />
                </div>
                <div>
                    <Skeleton width={120} height={14} style={{ marginBottom: '8px' }} />
                    <Skeleton width="100%" height={44} style={{ borderRadius: '8px' }} />
                </div>
            </div>

            {}
            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                <Skeleton width={140} height={44} style={{ borderRadius: '8px' }} />
            </div>
        </div>
    )
}
