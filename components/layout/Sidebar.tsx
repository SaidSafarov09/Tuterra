'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import * as Avatar from '@radix-ui/react-avatar'
import styles from './Sidebar.module.scss'
import { Button } from '@/components/ui/Button'
import { Logo } from '@/components/icons/Logo'
import { UserProfileModal } from '@/components/user/UserProfileModal'
import {
    LogoutIcon,
    CloseIcon,
} from '@/components/icons/Icons'
import { navigation } from '@/constants/links'
import { getInitials, stringToColor } from '@/constants'
import { SidebarUserSkeleton } from '@/components/skeletons'

interface SidebarProps {
    isOpen?: boolean
    onClose?: () => void
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = true, onClose }) => {
    const pathname = usePathname()
    const { data: session, status } = useSession()
    const [isUserModalOpen, setIsUserModalOpen] = useState(false)

    const avatarBgColor = session?.user?.name ? stringToColor(session.user.name) : 'var(--primary)'

    return (
        <>
            <aside className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''}`}>
                {onClose && (
                    <button
                        className={styles.closeButton}
                        onClick={onClose}
                        aria-label="Close menu"
                    >
                        <CloseIcon size={20} />
                    </button>
                )}
                <div className={styles.logo}>
                    <Logo size={32} />
                    <h1 className={styles.logoText}>Tuterra</h1>
                </div>

                <nav className={styles.nav}>
                    {navigation.map((item) => {
                        const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`)
                        const Icon = item.icon
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
                                onClick={() => onClose?.()}
                            >
                                <span className={styles.navIcon}>
                                    <Icon size={20} />
                                </span>
                                {item.name}
                            </Link>
                        )
                    })}
                </nav>

                <div className={styles.userSection}>
                    {status === 'loading' ? (
                        <SidebarUserSkeleton />
                    ) : (
                        <div
                            className={styles.userInfo}
                            onClick={() => setIsUserModalOpen(true)}
                            style={{ cursor: 'pointer' }}
                        >
                            <Avatar.Root className={styles.userAvatar}>
                                <Avatar.Image
                                    className={styles.avatarImage}
                                    src={session?.user?.image || undefined}
                                    alt={session?.user?.name || 'User'}
                                />
                                <Avatar.Fallback
                                    className={styles.avatarFallback}
                                    style={{ backgroundColor: avatarBgColor }}
                                >
                                    {getInitials(session?.user?.name)}
                                </Avatar.Fallback>
                            </Avatar.Root>
                            <div className={styles.userDetails}>
                                <p className={styles.userName}>{session?.user?.name || 'Пользователь'}</p>
                                <p className={styles.userEmail}>{session?.user?.email}</p>
                            </div>
                        </div>
                    )}
                    <Button
                        variant="ghost"
                        size="small"
                        fullWidth
                        onClick={() => signOut({ callbackUrl: '/login' })}
                        className={styles.logoutButton}
                    >
                        <LogoutIcon size={16} />
                        Выйти
                    </Button>
                </div>
            </aside>

            <UserProfileModal
                isOpen={isUserModalOpen}
                onClose={() => setIsUserModalOpen(false)}
                onSidebarClose={onClose}
            />
        </>
    )
}
