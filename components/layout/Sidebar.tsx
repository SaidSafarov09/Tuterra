'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import * as Avatar from '@radix-ui/react-avatar'
import styles from './Sidebar.module.scss'
import { Button } from '@/components/ui/Button'
import { Logo } from '@/components/icons/Logo'
import { UserProfileModal } from '@/components/user/UserProfileModal'
import {
    LogoutIcon,
    CloseIcon,
    SupportIcon
} from '@/components/icons/Icons'
import { Crown } from 'lucide-react'
import { UpgradeToProModal } from '@/components/pro/UpgradeToProModal'
import { teacherNavigation, studentNavigation } from '@/constants/links'
import { getInitials, stringToColor } from '@/constants'
import { SidebarUserSkeleton } from '@/components/skeletons'
import { ProBadge } from '@/components/layout/ProBadge'
import { useMediaQuery } from '@/hooks/useMediaQuery'

interface SidebarProps {
    isOpen?: boolean
    onClose?: () => void
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = true, onClose }) => {
    const pathname = usePathname()
    const { user, logout } = useAuthStore()
    const [isUserModalOpen, setIsUserModalOpen] = useState(false)
    const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false)
    const isMobile = useMediaQuery('(max-width: 768px)')

    const avatarBgColor = user?.name ? stringToColor(user.name) : 'var(--primary)'

    const navItems = user?.role === 'student' ? studentNavigation : teacherNavigation

    const filteredNavItems = navItems.filter(item => {
        if (user?.role === 'student' && (item as any).conditional) {
            return (user as any).groupsCount > 0
        }
        return true
    })

    return (
        <>
            <aside className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''}`}>
                {onClose && (
                    <button
                        className={styles.closeButton}
                        onClick={onClose}
                        aria-label="Close menu"
                    >
                        <CloseIcon size={16} />
                    </button>
                )}
                <div className={styles.logo}>
                    <Logo size={isMobile ? 24 : 32} />
                    <h1 className={styles.logoText}>Tuterra</h1>
                    <ProBadge />
                </div>

                <nav className={styles.nav}>
                    {filteredNavItems.map((item) => {
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
                                <span className={styles.navText}>{item.name}</span>
                            </Link>
                        )
                    })}
                </nav>

                {!isMobile && (
                    <>
                        {!(user?.isPro || user?.plan === 'pro') && (
                            <div className={styles.proSection}>
                                <Button
                                    className={styles.proButton}
                                    onClick={() => setIsUpgradeModalOpen(true)}
                                    variant="outline"
                                >
                                    <span className={styles.proButtonText}>Разблокировать</span>PRO
                                </Button>
                            </div>
                        )}

                        <div className={styles.supportSection}>
                            <a
                                href="https://t.me/tuterrahelp"
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.supportLink}
                            >
                                <span className={styles.navIcon}>
                                    <SupportIcon size={20} />
                                </span>
                                <span className={styles.navText}>Поддержка</span>
                            </a>
                        </div>

                        <div className={styles.userSection}>
                            <div
                                className={styles.userInfo}
                                onClick={() => setIsUserModalOpen(true)}
                                style={{ cursor: 'pointer' }}
                            >
                                <Avatar.Root className={styles.userAvatar}>
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
                                <div className={styles.userDetails}>
                                    <p className={styles.userName}>{user?.name || 'Пользователь'}</p>
                                    <p className={styles.userEmail}>{user?.phone || user?.email || ''}</p>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="small"
                                fullWidth
                                onClick={async () => {
                                    await logout()
                                    window.location.href = '/auth'
                                }}
                                className={styles.logoutButton}
                            >
                                <LogoutIcon size={16} />
                                <span className={styles.navText}>Выйти</span>
                            </Button>
                        </div>
                    </>
                )}
            </aside>

            <UserProfileModal
                isOpen={isUserModalOpen}
                onClose={() => setIsUserModalOpen(false)}
                onSidebarClose={onClose}
            />

            <UpgradeToProModal
                isOpen={isUpgradeModalOpen}
                onClose={() => setIsUpgradeModalOpen(false)}
                limitType="general"
            />
        </>
    )
}
