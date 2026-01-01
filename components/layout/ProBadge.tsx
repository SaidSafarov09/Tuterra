import React from 'react'
import styles from './ProBadge.module.scss'
import { CrownIcon } from '@/components/icons/Icons'

interface ProBadgeProps {
    isPro?: boolean
}

export const ProBadge: React.FC<ProBadgeProps> = ({ isPro }) => {
    return (
        <div className={styles.proContainer}>
            <CrownIcon size={20} className={styles.proIcon} />
            <span className={styles.proText}>Pro</span>
        </div>
    )
}