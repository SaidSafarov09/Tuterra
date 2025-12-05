'use client'

import React, { useState, useEffect } from 'react'
import { Sidebar } from './Sidebar'
import { MenuIcon, CloseIcon } from '@/components/icons/Icons'
import { useAuthStore } from '@/store/auth'
import { settingsApi } from '@/services/api'
import styles from './DashboardLayout.module.scss'

interface DashboardLayoutProps {
    children: React.ReactNode
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const { user, setUser } = useAuthStore()

    // Fetch user data on mount if not already loaded
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
                } catch (error) {
                    console.error('Failed to fetch user data:', error)
                }
            }
        }

        fetchUserData()
    }, [user, setUser])

    return (
        <div className={styles.layout}>
            <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />

            {isMobileMenuOpen && (
                <div
                    className={styles.overlay}
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            <main className={styles.main}>
                <button
                    className={styles.mobileMenuButton}
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    aria-label="Toggle menu"
                >
                    <MenuIcon size={20} />
                    <span>Меню</span>
                </button>

                <div className={styles.content}>{children}</div>
            </main>
        </div>
    )
}
