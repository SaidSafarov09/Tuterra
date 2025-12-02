'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
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
        if (!formData.name || formData.name.length < 2) {
            toast.error('Имя должно содержать минимум 2 символа')
            return false
        }

        if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            toast.error('Введите корректный email')
            return false
        }

        if (!formData.password || formData.password.length < 6) {
            toast.error('Пароль должен содержать минимум 6 символов')
            return false
        }

        return true
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

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

            const data = await response.json().catch(() => null)

            if (!response.ok) {
                // Если сервер вернул JSON с ошибкой - показываем её
                // Если нет (например, 500 Internal Server Error без JSON) - показываем общую
                const errorMsg = data?.error || 'Ошибка регистрации. Попробуйте позже.'
                toast.error(errorMsg)
                return
            }

            // Успешная регистрация
            toast.success('Регистрация успешна! Перенаправляем на страницу входа...')
            setTimeout(() => {
                router.push('/login?registered=true')
            }, 1000)
        } catch (error) {
            console.error('Registration error:', error)
            toast.error('Сервис временно недоступен. Попробуйте позже.')
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
