import React, { useState, useEffect } from 'react'
import * as Avatar from '@radix-ui/react-avatar'
import { useAuthStore } from '@/store/auth'
import { stringToColor, getInitials } from '@/constants'
import { UserProfileModal } from './UserProfileModal'
import {
    UserIcon,
    SettingsIcon,
    SupportIcon,
    LogoutIcon,
    ChevronRightIcon
} from '@/components/icons/Icons'
import Link from 'next/link'
import styles from './UserMobileMenu.module.scss'

export const UserMobileMenu: React.FC = () => {
    const { user, logout } = useAuthStore()
    const [isOpen, setIsOpen] = useState(false)
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted || !user) return null

    const avatarBgColor = user.name ? stringToColor(user.name) : 'var(--primary)'

    const toggleMenu = () => setIsOpen(!isOpen)

    const handleLogout = async () => {
        await logout()
        window.location.href = '/auth'
    }

    return (
        <>
            <div className={styles.container}>
                <button className={styles.avatarTrigger} onClick={toggleMenu}>
                    <Avatar.Root className={styles.userAvatar}>
                        <Avatar.Image
                            className={styles.avatarImage}
                            src={user.avatar || undefined}
                            alt={user.name || 'User'}
                        />
                        <Avatar.Fallback
                            className={styles.avatarFallback}
                            style={{ backgroundColor: avatarBgColor }}
                        >
                            {getInitials(user.name)}
                        </Avatar.Fallback>
                    </Avatar.Root>
                </button>

                {isOpen && (
                    <>
                        <div className={styles.overlay} onClick={() => setIsOpen(false)} />
                        <div className={styles.menu}>
                            <div className={styles.items}>

                                <Link href="/settings" className={styles.item} onClick={() => setIsOpen(false)}>
                                    <SettingsIcon size={18} />
                                    <span>Настройки</span>
                                </Link>

                                <a
                                    href="https://t.me/tuterrahelp"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={styles.item}
                                    onClick={() => setIsOpen(false)}
                                >
                                    <SupportIcon size={18} />
                                    <span>Поддержка</span>
                                </a>


                                <button
                                    className={styles.item}
                                    onClick={() => {
                                        setIsOpen(false)
                                        setIsProfileModalOpen(true)
                                    }}
                                >
                                    <UserIcon size={18} />
                                    <span>Аккаунт</span>
                                </button>

                                <div className={styles.divider} />

                                <button className={`${styles.item} ${styles.logout}`} onClick={handleLogout}>
                                    <LogoutIcon size={18} />
                                    <span>Выйти</span>
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>

            <UserProfileModal
                isOpen={isProfileModalOpen}
                onClose={() => setIsProfileModalOpen(false)}
            />
        </>
    )
}
