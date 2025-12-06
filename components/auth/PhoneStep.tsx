import React, { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { toast } from 'sonner'
import { YandexLogo } from '@/components/icons/YandexLogo'
import { GoogleLogo } from '@/components/icons/GoogleLogo'
import styles from './Auth.module.scss'
import { useMediaQuery } from '@/hooks/useMediaQuery'

interface PhoneStepProps {
    onSuccess: (sessionId: string, phone: string) => void
}

export function PhoneStep({ onSuccess }: PhoneStepProps) {
    const [phone, setPhone] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const isDesk = useMediaQuery('(min-width: 768px)')
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (phone.length !== 12) {
            toast.error('Введите полный номер телефона')
            return
        }

        setIsLoading(true)

        try {
            const response = await fetch('/api/auth/request-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone }),
            })

            const data = await response.json()

            if (!response.ok || !data.success) {
                throw new Error(data.error || 'Ошибка отправки кода')
            }

            toast.success('Код отправлен на ваш номер')
            onSuccess(data.sessionId, phone)
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Произошла ошибка')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className={styles.stepContainer}>
            <div className={styles.header}>
                <h1 className={styles.title}>Добро пожаловать в Tuterra</h1>
                <p className={styles.subtitle}>
                    Введите номер телефона для входа или регистрации
                </p>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
                <Input
                    type="tel"
                    value={phone}
                    onChange={handlePhoneChange}
                    placeholder="+7 (___) ___-__-__"
                    autoFocus
                    // disabled={isLoading}
                    disabled
                />

                <Button
                    type="submit"
                    disabled={isLoading || phone.length !== 12}
                    className={styles.submitButton}
                >
                    {isLoading ? 'Загрузка...' : 'Далее'}
                </Button>
                <p className={styles.subtitleError}>Вход по номеру телефона временно недоступен</p>
            </form>

            <div className={styles.divider}>
                или
            </div>

            <div className={styles.socialButtons}>
                <button
                    className={styles.socialYandex}
                    onClick={() => window.location.href = '/api/auth/yandex/login'}
                >
                    <div className={styles.yandex}>
                        <YandexLogo />
                        <p>{isDesk && "Войти с"} Яндекс ID</p>
                    </div>
                </button>
                <button
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
