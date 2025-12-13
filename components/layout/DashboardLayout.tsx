'use client'

import React, { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Sidebar } from './Sidebar'
import { MenuIcon } from '@/components/icons/Icons'
import { useAuthStore } from '@/store/auth'
import { settingsApi } from '@/services/api'
import { useTheme } from 'next-themes'
import styles from './DashboardLayout.module.scss'
import { MobileHeader } from './MobileHeader'
import { useMediaQuery } from '@/hooks/useMediaQuery'

interface DashboardLayoutProps {
    children: React.ReactNode
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const { user, setUser } = useAuthStore()
    const { setTheme } = useTheme()
    const isMobile = useMediaQuery('(max-width: 768px)')
    const pathname = usePathname()

    useEffect(() => {
        if (isMobileMenuOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'auto'
        }
        return () => {
            document.body.style.overflow = 'auto'
        }
    }, [isMobileMenuOpen])


    useEffect(() => {
        const fetchUserData = async () => {
            if (!user) {
                try {
                    const data = await settingsApi.get()
                    setUser({
                        id: data.id,
                        firstName: data.firstName || null,
                        lastName: data.lastName || null,
                        name: data.name || `${data.firstName} ${data.lastName}`.trim() || null,
                        email: data.email || null,
                        phone: data.phone || null,
                        avatar: data.avatar || null,
                    })


                    if (data.theme) {
                        setTheme(data.theme)
                    }
                } catch (error) {
                    console.error('Failed to fetch user data:', error)
                }
            }
        }

        fetchUserData()
    }, [user, setUser, setTheme])
    useEffect(() => {
        const handleCloseSidebar = () => {
            setIsMobileMenuOpen(false)
        }

        window.addEventListener('closeMobileSidebar', handleCloseSidebar)

        return () => {
            window.removeEventListener('closeMobileSidebar', handleCloseSidebar)
        }
    }, [])
    const pageTitles: Record<string, string> = {
      '/dashboard': 'Главная',
      '/groups': 'Группы',
      '/students': 'Ученики',
      '/income': 'Доходы',
      '/lessons': 'Занятия',
      '/calendar': 'Календарь',
      '/settings': 'Настройки',
    }
    let headerTitle = pageTitles[pathname] || ''

    useEffect(() => {
        setIsMobileMenuOpen(false)
    }, [pathname])

    const isMobilePage =
        pathname.includes('/new') ||
        pathname.includes('/edit') ||
        pathname.includes('/calendar/day') ||
        pathname.includes('/reschedule') ||
        pathname.startsWith('/subjects/')

    return (
        <div className={styles.layout}>
            <Sidebar
                isOpen={isMobileMenuOpen}
                onClose={() => setIsMobileMenuOpen(false)}
            />

            {isMobileMenuOpen && (
                <div
                    className={styles.overlay}
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            <main className={styles.main}>
                {/* Новый MobileHeader только на мобильном */}
                {isMobile && !isMobilePage && (
                    <MobileHeader
                        title={headerTitle}
                        onBurgerClick={() => setIsMobileMenuOpen(true)}
                    />
                )}
                <div className={styles.content}>{children}</div>
            </main>
        </div>
    )
}
