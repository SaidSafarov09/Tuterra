import React from 'react'
import { Skeleton } from '@/components/ui/Skeleton'

export const SidebarUserSkeleton: React.FC = () => {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', width: '100%' }}>
            <Skeleton variant="circular" width={40} height={40} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                <Skeleton width="80%" height={14} />
                <Skeleton width="60%" height={12} />
            </div>
        </div>
    )
}
