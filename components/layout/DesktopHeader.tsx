'use client'

import React from 'react'
import styles from './DesktopHeader.module.scss'
import { NotificationCenter } from '@/components/notifications/NotificationCenter'
import { useAuthStore } from '@/store/auth'
import * as Avatar from '@radix-ui/react-avatar'
import { getInitials, stringToColor } from '@/constants'

export const DesktopHeader: React.FC = () => {
    const { user } = useAuthStore()

    const avatarBgColor = user?.name ? stringToColor(user.name) : 'var(--primary)'

    return (
        <header className={styles.header}>
            <div className={styles.left}>
            </div>

            <div className={styles.right}>
                <NotificationCenter />

                <div className={styles.user}>
                    <div className={styles.userInfo}>
                        <span className={styles.userName}>{user?.firstName || 'Пользователь'}</span>
                        <span className={styles.userRole}>Преподаватель</span>
                    </div>
                    <Avatar.Root className={styles.avatar}>
                        <Avatar.Image
                            className={styles.avatarImage}
                            src={user?.avatar || undefined}
                            alt={user?.name || 'User'}
                        />
                        <Avatar.Fallback
                            className={styles.avatarFallback}
                            style={{ backgroundColor: avatarBgColor }}
                        >
                            {getInitials(user?.name)}
                        </Avatar.Fallback>
                    </Avatar.Root>
                </div>
            </div>
        </header>
    )
}
