'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Logo } from '@/components/icons/Logo'
import { Button } from '@/components/ui/Button'
import { LogIn, Menu, X } from 'lucide-react'
import styles from './Header.module.scss'
import { useMediaQuery } from '@/hooks/useMediaQuery'

export const Header = () => {
    const [isScrolled, setIsScrolled] = useState(false)
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const isMobile = useMediaQuery('(max-width: 768px)')

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20)
        }
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    const navLinks = [
        { name: 'Функции', href: '#features' },
        { name: 'Демо', href: '#demo' },
        { name: 'Почему мы', href: '#why-us' },
        { name: 'Цены', href: '#pricing' },
    ]

    return (
        <header className={`${styles.header} ${isScrolled ? styles.scrolled : ''}`}>
            <div className={styles.left}>
                <Link href="/" className={styles.logo}>
                    <Logo size={36} />
                    <span className={styles.name}>Tuterra</span>
                </Link>

                <nav className={styles.nav}>
                    {navLinks.map((link) => (
                        <Link
                            key={link.name}
                            href={link.href}
                            className={styles.navLink}
                        >
                            {link.name}
                        </Link>
                    ))}
                </nav>
            </div>

            <div className={styles.right}>
                <Link href="/auth" className={styles.loginLink}>
                    <span>Войти</span>
                </Link>
                <Link href="/auth" style={{ textDecoration: 'none' }}>
                    <Button
                        variant="primary"
                        className={`${styles.ctaButton} ${isScrolled ? styles.withShadow : ''}`}
                    >
                        {isMobile ? <LogIn /> : 'Начать бесплатно'}
                    </Button>
                </Link>

                <button
                    className={styles.menuButton}
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                    {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className={styles.mobileMenu}
                    >
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                href={link.href}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={styles.mobileNavLink}
                            >
                                {link.name}
                            </Link>
                        ))}
                        <Link href="/auth" onClick={() => setIsMobileMenuOpen(false)}>
                            <Button variant="ghost" fullWidth>Войти</Button>
                        </Link>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    )
}
