'use client'

import React, { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Check, Send, Link as LinkIcon, Smartphone, GraduationCap, Calendar, Bell, X, Search } from 'lucide-react'
import { toast } from 'sonner'
import styles from './StudentLinkModal.module.scss' // Reusing styles if possible, or create new
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface StudentConnectionModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess?: () => void
}

export const StudentConnectionModal: React.FC<StudentConnectionModalProps> = ({
    isOpen,
    onClose,
    onSuccess
}) => {
    const [code, setCode] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const handleConnect = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!code) return

        setIsLoading(true)
        try {
            const response = await fetch('/api/student/connect', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ referralCode: code.toUpperCase() })
            })

            const data = await response.json()

            if (!response.ok || !data.success) {
                throw new Error(data.error || 'Не удалось подключиться')
            }

            toast.success('Вы успешно подключились к преподавателю!')
            onSuccess?.()
            onClose()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Ошибка подключения')
        } finally {
            setIsLoading(false)
        }
    }

    const benefits = [
        {
            icon: <Calendar size={20} />,
            text: 'Ваше актуальное расписание занятий',
            colorClass: styles.blue
        },
        {
            icon: <Search size={20} />,
            text: 'Следите за темами и планом обучения',
            colorClass: styles.purple
        },
        {
            icon: <Bell size={20} />,
            text: 'Получайте уведомления об изменениях',
            colorClass: styles.orange
        }
    ]

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            withHeader={false}
            title="Подключение к преподавателю"
            maxWidth="600px"
            padding="0"
        >
            <div className={styles.container}>
                <div className={styles.header}>
                    {!onSuccess && ( // Only show X if it's not a mandatory first-time modal
                        <button
                            onClick={onClose}
                            className={styles.closeBtn}
                            style={{
                                position: 'absolute',
                                top: '20px',
                                right: '20px',
                                background: 'rgba(255,255,255,0.2)',
                                border: 'none',
                                borderRadius: '50%',
                                width: '32px',
                                height: '32px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                cursor: 'pointer',
                                zIndex: 10
                            }}
                        >
                            <X size={18} />
                        </button>
                    )}

                    <div className={styles.headerIcon}>
                        <LinkIcon size={32} />
                    </div>
                    <h2 className={styles.title}>Подключитесь к преподавателю</h2>
                    <p className={styles.subtitle}>
                        Введите код, чтобы увидеть свое расписание и учебные материалы
                    </p>
                </div>

                <div className={styles.content}>
                    <div className={styles.benefits} style={{ marginBottom: '32px' }}>
                        {benefits.map((benefit, index) => (
                            <div key={index} className={styles.benefitItem}>
                                <div className={`${styles.iconBox} ${benefit.colorClass}`}>
                                    {benefit.icon}
                                </div>
                                <span className={benefit.text.length > 30 ? styles.benefitTextSmall : styles.benefitText}>
                                    {benefit.text}
                                </span>
                            </div>
                        ))}
                    </div>

                    <form onSubmit={handleConnect} className={styles.methods}>
                        <div className={styles.methodCard} style={{ padding: '24px' }}>
                            <span className={styles.methodLabel}>Код приглашения</span>
                            <div style={{ marginTop: '12px' }}>
                                <Input
                                    placeholder="AAAAAAAA"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                                    className={styles.codeField}
                                    style={{ textAlign: 'center', fontSize: '20px', letterSpacing: '4px', fontWeight: 'bold' }}
                                    maxLength={8}
                                />
                                <span className={styles.inputHint}>
                                    Введите 8-значный код, полученный от преподавателя
                                </span>
                            </div>
                            <Button
                                type="submit"
                                fullWidth
                                disabled={isLoading || code.length < 6}
                                style={{ marginTop: '20px' }}
                            >
                                {isLoading ? 'Подключение...' : 'Подключиться'}
                            </Button>
                        </div>
                    </form>

                    <div className={styles.tipBox}>
                        <Info size={18} />
                        <span>Код можно получить у вашего преподавателя. Обычно это 8 символов.</span>
                    </div>
                </div>
            </div>
        </Modal>
    )
}

function Info({ size }: { size: number }) {
    return <GraduationCap size={size} />
}
