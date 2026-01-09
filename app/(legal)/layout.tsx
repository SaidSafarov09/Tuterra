import React from 'react'
import { Header } from '@/components/landing/Header'
import { Footer } from '@/components/landing/Footer'
import styles from './LegalLayout.module.scss'

export default function LegalLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div id="landing-root" className={styles.legalRoot}>
            <Header />
            <main className={styles.legalMain}>
                <div className={styles.legalContainer}>
                    <div className={styles.legalArticle}>
                        {children}
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    )
}
