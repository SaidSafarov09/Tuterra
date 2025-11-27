'use client'

import React, { useState } from 'react'
import { Sidebar } from './Sidebar'
import { MenuIcon, CloseIcon } from '@/components/icons/Icons'
import styles from './DashboardLayout.module.scss'

interface DashboardLayoutProps {
    children: React.ReactNode
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

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
