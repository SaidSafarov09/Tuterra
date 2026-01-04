import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import * as Avatar from '@radix-ui/react-avatar'
import { useAuthStore } from '@/store/auth'
import { stringToColor, getInitials } from '@/constants'
import { UserProfileModal } from './UserProfileModal'
import {
    UserIcon,
    SettingsIcon,
    SupportIcon,
    LogoutIcon,
} from '@/components/icons/Icons'
import Link from 'next/link'
import styles from './UserMobileMenu.module.scss'

export const UserMobileMenu: React.FC = () => {
    const { user, logout } = useAuthStore()
    const [isOpen, setIsOpen] = useState(false)
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
    const [mounted, setMounted] = useState(false)

    // Portal logic items
    const triggerRef = useRef<HTMLButtonElement>(null)
    const [menuPosition, setMenuPosition] = useState<React.CSSProperties>({})

    useEffect(() => {
        setMounted(true)
    }, [])

    // Close menu on scroll to avoid detached popup
    useEffect(() => {
        if (!isOpen) return

        const handleScroll = () => {
            setIsOpen(false)
        }

        window.addEventListener('scroll', handleScroll, { capture: true })
        return () => window.removeEventListener('scroll', handleScroll, { capture: true })
    }, [isOpen])

    if (!mounted || !user) return null

    const avatarBgColor = user.name ? stringToColor(user.name) : 'var(--primary)'

    const toggleMenu = () => {
        if (!isOpen && triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect()
            setMenuPosition({
                position: 'fixed',
                top: `${rect.bottom + 8}px`,
                right: `${window.innerWidth - rect.right}px`,
                zIndex: 1002 // Ensure it is above sidebar (z-index 100)
            })
            setIsOpen(true)
        } else {
            setIsOpen(false)
        }
    }

    const handleLogout = async () => {
        await logout()
        window.location.href = '/auth'
    }

    return (
        <>
            <div className={styles.container}>
                <button
                    ref={triggerRef}
                    className={styles.avatarTrigger}
                    onClick={toggleMenu}
                >
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

                {isOpen && createPortal(
                    <div style={{ position: 'relative', zIndex: 1002 }}>
                        {/* Overlay to close menu */}
                        <div
                            className={styles.overlay}
                            onClick={() => setIsOpen(false)}
                            style={{ zIndex: 1001 }}
                        />

                        {/* Menu content */}
                        <div
                            className={styles.menu}
                            style={menuPosition}
                        >
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
                    </div>,
                    document.body
                )}
            </div>

            <UserProfileModal
                isOpen={isProfileModalOpen}
                onClose={() => setIsProfileModalOpen(false)}
            />
        </>
    )
}
