'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import styles from '../auth.module.scss'

function LoginForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    })
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [successMessage, setSuccessMessage] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        if (searchParams?.get('registered') === 'true') {
            toast.success('Регистрация успешна! Теперь вы можете войти.')
        }
    }, [searchParams])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData((prev) => ({ ...prev, [name]: value }))
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: '' }))
        }
    }

    const validateForm = () => {
        if (!formData.email) {
            toast.error('Введите email')
            return false
        }

        if (!formData.password) {
            toast.error('Введите пароль')
            return false
        }

        return true
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSuccessMessage('')

        if (!validateForm()) {
            return
        }

        setIsLoading(true)

        try {
            const result = await signIn('credentials', {
                email: formData.email,
                password: formData.password,
                redirect: false,
            })

            if (result?.error) {
                // Если ошибка от сервера понятная (например, "Неверный пароль"), показываем её
                // Если нет - показываем общую
                const message = result.error === 'CredentialsSignin'
                    ? 'Неверный email или пароль'
                    : 'Ошибка входа. Проверьте данные.'

                toast.error(message)
                return
            }

            if (result?.ok) {
                toast.success('Вход выполнен успешно!')
                router.push('/dashboard')
                router.refresh()
            }
        } catch (error) {
            console.error('Login error:', error)
            toast.error('Сервис временно недоступен. Попробуйте позже.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <div className={styles.header}>
                    <h1 className={styles.logo}>Tuterra</h1>
                    <h2 className={styles.title}>Добро пожаловать</h2>
                    <p className={styles.subtitle}>Войдите в свой аккаунт</p>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    {successMessage && <div className={styles.success}>{successMessage}</div>}

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
                        placeholder="Введите пароль"
                        disabled={isLoading}
                    />

                    <Button type="submit" fullWidth disabled={isLoading}>
                        {isLoading ? 'Вход...' : 'Войти'}
                    </Button>
                </form>

                <div className={styles.footer}>
                    Нет аккаунта?{' '}
                    <Link href="/register" className={styles.link}>
                        Зарегистрироваться
                    </Link>
                </div>
            </div>
        </div>
    )
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className={styles.container}>
                <div className={styles.card}>
                    <div className={styles.header}>
                        <h1 className={styles.logo}>Tuterra</h1>
                        <h2 className={styles.title}>Загрузка...</h2>
                    </div>
                </div>
            </div>
        }>
            <LoginForm />
        </Suspense>
    )
}
