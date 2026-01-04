import React from 'react'
import styles from './ProBadge.module.scss'
import { CrownIcon } from '@/components/icons/Icons'
import { useAuthStore } from '@/store/auth'

export const ProBadge: React.FC = () => {
    const { user } = useAuthStore()

    const isPro = user?.isPro || user?.plan === 'pro'
    if (!isPro) return null

    return (
        <div className={styles.proContainer}>
            <span className={styles.proText}>PRO</span>
        </div>
    )
}