'use client'

import React from 'react'
import { Logo } from '@/components/icons/Logo'
import Link from 'next/link'
import styles from './Footer.module.scss'

export const Footer = () => {
    return (
        <footer className={styles.footer}>
            <div className={styles.container}>
                <div className={styles.main}>
                    <div className={styles.brand}>
                        <Link href="/" className={styles.logo}>
                            <Logo size={24} />
                            <span className={styles.companyName}>Tuterra</span>
                        </Link>
                        <p className={styles.tagline}>Сделано с любовью для преподавателей.</p>
                    </div>

                    <div className={styles.links}>
                        <Link href="#features">Функции</Link>
                        <Link href="#pricing">Цены</Link>
                        <Link href="/auth">Войти</Link>
                        <Link href="#">Поддержка</Link>
                    </div>
                </div>

                <div className={styles.bottom}>
                    <p>© {new Date().getFullYear()} Tuterra</p>
                    <div className={styles.legal}>
                        <Link href="#">Оферта</Link>
                        <Link href="#">Приватность</Link>
                    </div>
                </div>
            </div>
        </footer>
    )
}
