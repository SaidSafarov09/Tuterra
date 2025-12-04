import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/auth'
import { useRouter } from 'next/navigation'
import styles from './Auth.module.scss'

interface CodeStepProps {
    sessionId: string
    phone: string
    onBack: () => void
}

export function CodeStep({ sessionId, phone, onBack }: CodeStepProps) {
    const [code, setCode] = useState(['', '', '', '', '', ''])
    const [isLoading, setIsLoading] = useState(false)
    const [canResend, setCanResend] = useState(false)
    const [timer, setTimer] = useState(60)
    const inputRefs = useRef<(HTMLInputElement | null)[]>([])
    const router = useRouter()
    const { login } = useAuthStore()

    useEffect(() => {
        inputRefs.current[0]?.focus()
        const interval = setInterval(() => {
            setTimer((prev) => {
                if (prev <= 1) {
                    setCanResend(true)
                    clearInterval(interval)
                    return 0
                }
                return prev - 1
            })
        }, 1000)

        return () => clearInterval(interval)
    }, [])

    const handleChange = (index: number, value: string) => {
        // Only allow digits
        if (value && !/^\d$/.test(value)) return

        const newCode = [...code]
        newCode[index] = value

        setCode(newCode)
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus()
        }
        if (newCode.every((digit) => digit !== '') && !isLoading) {
            handleSubmit(newCode.join(''))
        }
    }

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !code[index] && index > 0) {
            inputRefs.current[index - 1]?.focus()
        }
    }

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault()
        const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)

        const newCode = [...code]
        pastedData.split('').forEach((digit, index) => {
            if (index < 6) newCode[index] = digit
        })

        setCode(newCode)

        const lastIndex = Math.min(pastedData.length, 5)
        inputRefs.current[lastIndex]?.focus()
        if (pastedData.length === 6) {
            handleSubmit(pastedData)
        }
    }

    const handleSubmit = async (codeValue?: string) => {
        const finalCode = codeValue || code.join('')

        if (finalCode.length !== 6) {
            toast.error('Введите полный код')
            return
        }

        setIsLoading(true)

        try {
            const response = await fetch('/api/auth/verify-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId, code: finalCode }),
            })

            const data = await response.json()

            if (!response.ok || !data.success) {
                throw new Error(data.error || 'Неверный код')
            }

            login(data.token, data.user)
            toast.success('Вход выполнен успешно!')
            router.push('/dashboard')
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Произошла ошибка')
            setCode(['', '', '', '', '', ''])
            inputRefs.current[0]?.focus()
        } finally {
            setIsLoading(false)
        }
    }

    const handleResend = async () => {
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

            toast.success('Новый код отправлен')
            setCanResend(false)
            setTimer(60)
            setCode(['', '', '', '', '', ''])
            inputRefs.current[0]?.focus()

            const interval = setInterval(() => {
                setTimer((prev) => {
                    if (prev <= 1) {
                        setCanResend(true)
                        clearInterval(interval)
                        return 0
                    }
                    return prev - 1
                })
            }, 1000)
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Произошла ошибка')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className={styles.stepContainer}>
            <div className={styles.header}>
                <h1 className={styles.title}>Введите код</h1>
                <p className={styles.subtitle}>
                    Мы отправили код на номер<br />
                    <strong>{phone}</strong>
                </p>
            </div>

            <div className={styles.codeInputs}>
                {code.map((digit, index) => (
                    <input
                        key={index}
                        ref={(el) => {
                            inputRefs.current[index] = el;
                        }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        onPaste={index === 0 ? handlePaste : undefined}
                        disabled={isLoading}
                        className={styles.codeInput}
                    />
                ))}
            </div>

            <div className={styles.actions}>
                <Button
                    type="button"
                    onClick={() => handleSubmit()}
                    disabled={isLoading || code.some((d) => !d)}
                    className={styles.submitButton}
                >
                    {isLoading ? 'Проверка...' : 'Подтвердить'}
                </Button>

                {canResend ? (
                    <button
                        type="button"
                        onClick={handleResend}
                        disabled={isLoading}
                        className={styles.resendButton}
                    >
                        Отправить код повторно
                    </button>
                ) : (
                    <p className={styles.timer}>
                        Отправить повторно через {timer} сек
                    </p>
                )}

                <button
                    type="button"
                    onClick={onBack}
                    disabled={isLoading}
                    className={styles.backButton}
                >
                    Изменить номер
                </button>
            </div>
        </div>
    )
}
