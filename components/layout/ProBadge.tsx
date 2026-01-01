import React from 'react'
import styles from './ProBadge.module.scss'
import { CrownIcon } from '@/components/icons/Icons'
import { useAuthStore } from '@/store/auth'

export const ProBadge: React.FC = () => {
    const { user } = useAuthStore()

    if (user?.plan !== 'pro') return null

    return (
        <div className={styles.proContainer}>
            <CrownIcon size={20} className={styles.proIcon} />
            <span className={styles.proText}>Pro</span>
        </div>
    )
}