'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import styles from '../auth.module.scss'

export default function RegisterPage() {
    const router = useRouter()
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
    })
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [generalError, setGeneralError] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData((prev) => ({ ...prev, [name]: value }))
        // Очищаем ошибку при изменении поля
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: '' }))
        }
    }

    const validateForm = () => {
        const newErrors: Record<string, string> = {}

        if (!formData.name || formData.name.length < 2) {
            newErrors.name = 'Имя должно содержать минимум 2 символа'
        }

        if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Введите корректный email'
        }

        if (!formData.password || formData.password.length < 6) {
            newErrors.password = 'Пароль должен содержать минимум 6 символов'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setGeneralError('')

        if (!validateForm()) {
            return
        }

        setIsLoading(true)

        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            })

            const data = await response.json()

            if (!response.ok) {
                setGeneralError(data.error || 'Произошла ошибка при регистрации')
                return
            }

            // Успешная регистрация - перенаправляем на страницу входа
            router.push('/login?registered=true')
        } catch (error) {
            console.error('Registration error:', error)
            setGeneralError('Произошла ошибка при регистрации')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <div className={styles.header}>
                    <h1 className={styles.logo}>SkillTrack</h1>
                    <h2 className={styles.title}>Создать аккаунт</h2>
                    <p className={styles.subtitle}>Начните управлять своими учениками и занятиями</p>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    {generalError && <div className={styles.error}>{generalError}</div>}

                    <Input
                        label="Имя"
                        name="name"
                        type="text"
                        value={formData.name}
                        onChange={handleChange}
                        error={errors.name}
                        required
                        placeholder="Иван Иванов"
                        disabled={isLoading}
                    />

                    <Input
                        label="Email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        error={errors.email}
                        required
                        placeholder="ivan@example.com"
                        disabled={isLoading}
                    />

                    <Input
                        label="Пароль"
                        name="password"
                        type="password"
                        value={formData.password}
                        onChange={handleChange}
                        error={errors.password}
                        required
                        placeholder="Минимум 6 символов"
                        disabled={isLoading}
                    />

                    <Button type="submit" fullWidth disabled={isLoading}>
                        {isLoading ? 'Регистрация...' : 'Зарегистрироваться'}
                    </Button>
                </form>

                <div className={styles.footer}>
                    Уже есть аккаунт?{' '}
                    <Link href="/login" className={styles.link}>
                        Войти
                    </Link>
                </div>
            </div>
        </div>
    )
}
