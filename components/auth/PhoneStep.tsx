import React, { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { toast } from 'sonner'
import { YandexLogo } from '@/components/icons/YandexLogo'
import { GoogleLogo } from '@/components/icons/GoogleLogo'
import styles from './Auth.module.scss'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { Check } from 'lucide-react'

import { useSearchParams } from 'next/navigation'
import { useEffect } from 'react'

interface PhoneStepProps {
    onSuccess: (sessionId: string, email: string, role: 'teacher' | 'student', referralCode?: string | null) => void
}

export function PhoneStep({ onSuccess }: PhoneStepProps) {
    const searchParams = useSearchParams()
    const [email, setEmail] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [userRole, setUserRole] = useState<'teacher' | 'student'>('teacher')
    const isDesk = useMediaQuery('(min-width: 768px)')

    useEffect(() => {
        const ref = searchParams.get('ref')
        if (ref) {
            setUserRole('student')
        }

        // Check for error in cookies (for OAuth redirects)
        const checkAuthError = () => {
            const cookies = document.cookie.split(';').reduce((acc, cookie) => {
                const [key, value] = cookie.trim().split('=')
                acc[key] = value
                return acc
            }, {} as Record<string, string>)

            if (cookies['auth_error'] === 'account_is_teacher') {
                toast.error('Этот аккаунт уже зарегистрирован как преподаватель и не может быть учеником')
                // Clear the cookie so it doesn't show again
                document.cookie = 'auth_error=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
            }
        }

        checkAuthError()
    }, [searchParams])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!email || !email.includes('@')) {
            toast.error('Введите корректный email')
            return
        }

        setIsLoading(true)

        try {
            const response = await fetch('/api/auth/send-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            })

            const data = await response.json()

            if (!response.ok || !data.success) {
                throw new Error(data.error || 'Ошибка отправки кода')
            }

            toast.success('Код отправлен на ваш email')
            onSuccess(data.sessionId || '', email, userRole, userRole === 'student' ? searchParams.get('ref') : null)
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Произошла ошибка')
        } finally {
            setIsLoading(false)
        }
    }

    const handleSocialLogin = (provider: 'google' | 'yandex') => {
        const ref = userRole === 'student' ? searchParams.get('ref') : null
        const baseUrl = `/api/auth/${provider}/login`
        const url = ref ? `${baseUrl}?ref=${ref}` : baseUrl
        window.location.href = url
    }

    return (
        <div className={styles.stepContainer}>
            <div className={styles.header}>
                <h1 className={styles.title}>Вход в Tuterra</h1>
                <p className={styles.subtitle}>
                    Выберите роль и воспользуйтесь удобным способом входа
                </p>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.roleSelection}>
                    <div
                        className={`${styles.roleOption} ${userRole === 'teacher' ? styles.selected : ''}`}
                        onClick={() => setUserRole('teacher')}
                    >
                        <div className={`${styles.checkbox} ${userRole === 'teacher' ? styles.checked : ''}`}>
                            {userRole === 'teacher' && <Check size={12} strokeWidth={4} />}
                        </div>
                        <span className={styles.roleLabel}>Я репетитор</span>
                    </div>
                    <div
                        className={`${styles.roleOption} ${userRole === 'student' ? styles.selected : ''}`}
                        onClick={() => setUserRole('student')}
                    >
                        <div className={`${styles.checkbox} ${userRole === 'student' ? styles.checked : ''}`}>
                            {userRole === 'student' && <Check size={12} strokeWidth={4} />}
                        </div>
                        <span className={styles.roleLabel}>Я ученик</span>
                    </div>
                </div>
                <p className={styles.label}>Введите ваш email</p>
                <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@mail.ru"
                    autoFocus
                    required
                />

                <Button
                    type="submit"
                    disabled={isLoading || !email}
                    className={styles.submitButton}
                >
                    {isLoading ? 'Загрузка...' : 'Получить код'}
                </Button>
            </form>

            <div className={styles.divider}>
                или
            </div>

            <div className={styles.socialButtons}>
                <button
                    type="button"
                    className={styles.socialYandex}
                    onClick={() => handleSocialLogin('yandex')}
                >
                    <div className={styles.yandex}>
                        <YandexLogo />
                        <p>{isDesk && "Войти с"} Яндекс ID</p>
                    </div>
                </button>
                <button
                    type="button"
                    className={styles.socialGoogle}
                    onClick={() => handleSocialLogin('google')}
                >
                    <div className={styles.google}>
                        <GoogleLogo />
                        <p>{isDesk && "Войти с"} Google</p>
                    </div>
                </button>
            </div>
        </div>
    )
}
