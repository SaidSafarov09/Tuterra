'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import styles from '../auth.module.scss'

export default function LoginPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    })
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [generalError, setGeneralError] = useState('')
    const [successMessage, setSuccessMessage] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        if (searchParams?.get('registered') === 'true') {
            setSuccessMessage('Регистрация успешна! Теперь вы можете войти.')
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
        const newErrors: Record<string, string> = {}

        if (!formData.email) {
            newErrors.email = 'Введите email'
        }

        if (!formData.password) {
            newErrors.password = 'Введите пароль'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setGeneralError('')
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
                setGeneralError(result.error)
                return
            }

            if (result?.ok) {
                router.push('/dashboard')
                router.refresh()
            }
        } catch (error) {
            console.error('Login error:', error)
            setGeneralError('Произошла ошибка при входе')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <div className={styles.header}>
                    <h1 className={styles.logo}>SkillTrack</h1>
                    <h2 className={styles.title}>Добро пожаловать</h2>
                    <p className={styles.subtitle}>Войдите в свой аккаунт</p>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    {successMessage && <div className={styles.success}>{successMessage}</div>}
                    {generalError && <div className={styles.error}>{generalError}</div>}

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
