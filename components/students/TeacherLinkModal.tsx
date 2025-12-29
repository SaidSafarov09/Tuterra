'use client'

import React, { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { GraduationCap, ArrowRight, Check } from 'lucide-react'
import { toast } from 'sonner'
import styles from './TeacherLinkModal.module.scss'

interface TeacherLinkModalProps {
    isOpen: boolean
    onClose: () => void
    onLinkSuccess?: () => void
}

export const TeacherLinkModal: React.FC<TeacherLinkModalProps> = ({ isOpen, onClose, onLinkSuccess }) => {
    const [code, setCode] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!code.trim()) return

        setIsSubmitting(true)
        try {
            const response = await fetch('/api/student/link-teacher', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: code.toUpperCase() })
            })

            const data = await response.json()
            if (data.success) {
                setIsSuccess(true)
                toast.success('Репетитор успешно добавлен!')
                setTimeout(() => {
                    onLinkSuccess?.()
                    onClose()
                    setIsSuccess(false)
                    setCode('')
                }, 2000)
            } else {
                toast.error(data.error || 'Неверный код преподавателя')
            }
        } catch (error) {
            toast.error('Произошла ошибка при подключении')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Подключение к репетитору"
            maxWidth="500px"
        >
            <div className={styles.container}>
                <div className={styles.header}>
                    <div className={styles.iconWrapper}>
                        <GraduationCap size={40} color="var(--primary)" />
                    </div>
                    <h2 className={styles.title}>Введите код преподавателя</h2>
                    <p className={styles.subtitle}>
                        Получите код у своего репетитора, чтобы видеть расписание и получать уведомления
                    </p>
                </div>

                {isSuccess ? (
                    <div className={styles.successState}>
                        <div className={styles.successIcon}>
                            <Check size={48} color="var(--success)" />
                        </div>
                        <p className={styles.successText}>Вы успешно подключены!</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className={styles.form}>
                        <div className={styles.inputGroup}>
                            <Input
                                value={code}
                                onChange={(e) => setCode(e.target.value.toUpperCase())}
                                placeholder="Например: ABC123"
                                className={styles.codeInput}
                                maxLength={6}
                                autoFocus
                            />
                        </div>
                        <Button
                            type="submit"
                            fullWidth
                            isLoading={isSubmitting}
                            disabled={code.length < 4}
                            className={styles.submitButton}
                        >
                            Подключиться
                            <ArrowRight size={18} />
                        </Button>
                    </form>
                )}
            </div>
        </Modal>
    )
}
