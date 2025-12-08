'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Sun, Moon, Monitor } from 'lucide-react'
import styles from './ThemeToggle.module.scss'
import { toast } from 'sonner'

export function ThemeToggle() {
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = useState(false)

    
    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return null
    }

    const handleThemeChange = async (newTheme: string) => {
        setTheme(newTheme)

        try {
            await fetch('/api/user/theme', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ theme: newTheme }),
            })
        } catch (error) {
            console.error('Failed to save theme preference', error)
            
        }
    }

    return (
        <div className={styles.container}>
            <label className={styles.label}>Тема оформления</label>
            <div className={styles.toggleGroup}>
                <button
                    className={`${styles.toggleButton} ${theme === 'light' ? styles.active : ''}`}
                    onClick={() => handleThemeChange('light')}
                    type="button"
                >
                    <Sun size={18} />
                    Светлая
                </button>
                <button
                    className={`${styles.toggleButton} ${theme === 'dark' ? styles.active : ''}`}
                    onClick={() => handleThemeChange('dark')}
                    type="button"
                >
                    <Moon size={18} />
                    Темная
                </button>
                <button
                    className={`${styles.toggleButton} ${theme === 'system' ? styles.active : ''}`}
                    onClick={() => handleThemeChange('system')}
                    type="button"
                >
                    <Monitor size={18} />
                    Системная
                </button>
            </div>
        </div>
    )
}
