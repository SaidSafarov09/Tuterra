import React, { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { toast } from 'sonner'
import { YandexLogo } from '@/components/icons/YandexLogo'
import { GoogleLogo } from '@/components/icons/GoogleLogo'
import styles from './Auth.module.scss'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { Check } from 'lucide-react'

interface PhoneStepProps {
    onSuccess: (sessionId: string, email: string) => void
}

export function PhoneStep({ onSuccess }: PhoneStepProps) {
    const [email, setEmail] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [userRole, setUserRole] = useState<'tutor' | 'student'>('tutor')
    const isDesk = useMediaQuery('(min-width: 768px)')

    /* 
    const [phone, setPhone] = useState('')
    const formatPhoneNumber = (value: string) => {
        const digits = value.replace(/\D/g, '')
        if (!digits) return '+7'
        if (digits[0] === '7') {
            return '+7' + digits.slice(1, 11)
        }
        if (digits[0] === '8') {
            return '+7' + digits.slice(1, 11)
        }
        return '+7' + digits.slice(0, 10)
    }

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatPhoneNumber(e.target.value)
        setPhone(formatted)
    }
    */

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
            onSuccess(data.sessionId || '', email) // The API returns success but sessionId is missing in my send-code? Let me check.
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Произошла ошибка')
        } finally {
            setIsLoading(false)
        }
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
                        className={`${styles.roleOption} ${userRole === 'tutor' ? styles.selected : ''}`}
                        onClick={() => setUserRole('tutor')}
                    >
                        <div className={`${styles.checkbox} ${userRole === 'tutor' ? styles.checked : ''}`}>
                            {userRole === 'tutor' && <Check size={12} strokeWidth={4} />}
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
                    onClick={() => window.location.href = '/api/auth/yandex/login'}
                >
                    <div className={styles.yandex}>
                        <YandexLogo />
                        <p>{isDesk && "Войти с"} Яндекс ID</p>
                    </div>
                </button>
                <button
                    type="button"
                    className={styles.socialGoogle}
                    onClick={() => window.location.href = '/api/auth/google/login'}
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
