'use client'

import React from 'react'
import { Logo } from '@/components/icons/Logo'
import Link from 'next/link'
import styles from './Footer.module.scss'

export const Footer = () => {
    return (
        <footer className={styles.footer}>
            <div className={styles.container}>
                <div className={styles.grid}>
                    <div className={styles.brand}>
                        <Link href="/" className={styles.logo}>
                            <Logo size={28} />
                            <span className={styles.companyName}>Tuterra</span>
                        </Link>
                        <p className={styles.brandDesc}>
                            Лучшая платформа для преподавателей, которые хотят автоматизировать работу и сосредоточиться на учениках.
                        </p>
                    </div>

                    <div>
                        <h4 className={styles.columnTitle}>Продукт</h4>
                        <ul className={styles.list}>
                            <li><Link href="#features">Функции</Link></li>
                            <li><Link href="#demo">Демо</Link></li>
                            <li><Link href="#pricing">Цены</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className={styles.columnTitle}>Компания</h4>
                        <ul className={styles.list}>
                            <li><Link href="#">О нас</Link></li>
                            <li><Link href="#">Блог</Link></li>
                            <li><Link href="#">Контакты</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className={styles.columnTitle}>Юридическая информация</h4>
                        <ul className={styles.list}>
                            <li><Link href="#">Публичная оферта</Link></li>
                            <li><Link href="#">Конфиденциальность</Link></li>
                        </ul>
                    </div>
                </div>

                <div className={styles.bottom}>
                    <p className={styles.copyright}>
                        © {new Date().getFullYear()} Tuterra. Все права защищены.
                    </p>
                    <div className={styles.socials}>
                        {/* Social Links placeholders */}
                    </div>
                </div>
            </div>
        </footer>
    )
}
