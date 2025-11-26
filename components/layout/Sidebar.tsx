'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import * as Avatar from '@radix-ui/react-avatar'
import styles from './Sidebar.module.scss'
import { Button } from '@/components/ui/Button'
import { Logo } from '@/components/icons/Logo'
import {
    DashboardIcon,
    StudentsIcon,
    LessonsIcon,
    SettingsIcon,
    SubjectsIcon,
    PaymentsIcon,
    LogoutIcon,
} from '@/components/icons/Icons'

const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: DashboardIcon },
    { name: 'Ученики', href: '/students', icon: StudentsIcon },
    { name: 'Занятия', href: '/lessons', icon: LessonsIcon },
    { name: 'Предметы', href: '/subjects', icon: SubjectsIcon },
    { name: 'Доходы', href: '/income', icon: PaymentsIcon },
    { name: 'Настройки', href: '/settings', icon: SettingsIcon },
]

interface SidebarProps {
    isOpen?: boolean
    onClose?: () => void
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = true, onClose }) => {
    const pathname = usePathname()
    const { data: session } = useSession()

    const getInitials = (name?: string | null) => {
        if (!name) return '?'
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)
    }

    return (
        <aside className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''}`}>
            <div className={styles.logo}>
                <Logo size={32} />
                <h1 className={styles.logoText}>SkillTrack</h1>
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
                <div className={styles.userInfo}>
                    <Avatar.Root className={styles.userAvatar}>
                        <Avatar.Image
                            className={styles.avatarImage}
                            src={session?.user?.image || undefined}
                            alt={session?.user?.name || 'User'}
                        />
                        <Avatar.Fallback className={styles.avatarFallback}>
                            {getInitials(session?.user?.name)}
                        </Avatar.Fallback>
                    </Avatar.Root>
                    <div className={styles.userDetails}>
                        <p className={styles.userName}>{session?.user?.name || 'Пользователь'}</p>
                        <p className={styles.userEmail}>{session?.user?.email}</p>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    size="small"
                    fullWidth
                    onClick={() => signOut({ callbackUrl: '/login' })}
                >
                    <LogoutIcon size={16} />
                    Выйти
                </Button>
            </div>
        </aside>
    )
}
