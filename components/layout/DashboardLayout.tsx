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
import { DesktopHeader } from './DesktopHeader'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { OnboardingProvider } from '@/components/onboarding/OnboardingProvider'
import { ReferralBonusManager } from '@/components/settings/ReferralBonusManager'

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
            try {
                const data = await settingsApi.get()
                setUser({
                    ...data,
                    name: data.name || `${data.firstName} ${data.lastName}`.trim() || null,
                } as any)


                if (data.theme) {
                    setTheme(data.theme)
                }
            } catch (error) {
                console.error('Failed to sync user data:', error)
            }
        }

        fetchUserData()
    }, [setUser, setTheme])
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
        <OnboardingProvider userOnboardingCompleted={user?.role === 'student' ? true : user?.onboardingCompleted}>
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
                    {!isMobile && <DesktopHeader />}
                    {isMobile && !isMobilePage && (
                        <MobileHeader
                            title={headerTitle}
                            onBurgerClick={() => setIsMobileMenuOpen(true)}
                        />
                    )}
                    <div className={`${styles.content} page-transition`} key={pathname}>
                        {children}
                    </div>
                </main>
                <ReferralBonusManager />
            </div>
        </OnboardingProvider>
    )
}
