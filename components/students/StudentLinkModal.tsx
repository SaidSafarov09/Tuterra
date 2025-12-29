'use client'

import React, { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Check, Copy, Link as LinkIcon, Smartphone, GraduationCap, Calendar, Bell, X } from 'lucide-react'
import { toast } from 'sonner'
import styles from './StudentLinkModal.module.scss'
import { Button } from '@/components/ui/Button'

interface StudentLinkModalProps {
    isOpen: boolean
    onClose: () => void
    referralCode: string
}

export const StudentLinkModal: React.FC<StudentLinkModalProps> = ({
    isOpen,
    onClose,
    referralCode
}) => {
    const [copiedType, setCopiedType] = useState<'link' | 'code' | null>(null)

    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    const referralLink = `${baseUrl}/auth?ref=${referralCode}`
    const inviteText = `Привет! Подключайся к моим занятиям в Tuterra: ${referralLink}`

    const handleCopy = async (text: string, type: 'link' | 'code') => {
        try {
            await navigator.clipboard.writeText(text)
            setCopiedType(type)
            toast.success(type === 'link' ? 'Приглашение скопировано' : 'Код скопирован')
            setTimeout(() => setCopiedType(null), 2000)
        } catch (err) {
            toast.error('Не удалось скопировать')
        }
    }

    const benefits = [
        {
            icon: <Calendar size={20} />,
            text: 'Актуальное расписание занятий всегда под рукой',
            colorClass: styles.blue
        },
        {
            icon: <Smartphone size={20} />,
            text: 'Удобное управление переносами и отменами',
            colorClass: styles.purple
        },
        {
            icon: <Bell size={20} />,
            text: 'Мгновенные уведомления о важных изменениях',
            colorClass: styles.orange
        }
    ]

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            withHeader={false}
            title="Подключение ученика"
            maxWidth="720px"
            padding="0"
        >
            <div className={styles.container}>
                <div className={styles.header}>
                    <button
                        onClick={onClose}
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

                    <div className={styles.headerIcon}>
                        <GraduationCap size={32} />
                    </div>
                    <h2 className={styles.title}>Подключите ученика к Tuterra</h2>
                    <p className={styles.subtitle}>
                        Это позволит ученику видеть расписание, получать уведомления и подтверждать оплаты
                    </p>
                </div>

                <div className={styles.content}>
                    <div className={styles.benefits}>
                        {benefits.map((benefit, index) => (
                            <div key={index} className={styles.benefitItem}>
                                <div className={`${styles.iconBox} ${benefit.colorClass}`}>
                                    {benefit.icon}
                                </div>
                                <span className={styles.benefitText}>{benefit.text}</span>
                            </div>
                        ))}
                    </div>

                    <div className={styles.methods}>
                        <div className={styles.methodCard}>
                            <span className={styles.methodLabel}>Способ 1: Ссылка</span>
                            <div className={styles.value}>
                                {referralLink}
                            </div>
                            <p className={styles.methodHint}>
                                Ученик перейдет по ссылке и <strong>автоматически</strong> закрепится за вами сразу после регистрации.
                            </p>
                            <Button
                                className={`${styles.copyAction} ${copiedType === 'link' ? styles.copied : ''}`}
                                onClick={() => handleCopy(inviteText, 'link')}
                            >
                                {copiedType === 'link' ? <Check size={18} /> : <Copy size={18} />}
                                {copiedType === 'link' ? 'Скопировано' : 'Копировать приглашение'}
                            </Button>
                        </div>

                        <div className={styles.methodCard}>
                            <span className={styles.methodLabel}>Способ 2: Код</span>
                            <div className={`${styles.value} ${styles.codeValue}`}>
                                {referralCode || '------'}
                            </div>
                            <p className={styles.methodHint}>
                                Если ученик зарегистрировался сам, он должен <strong>ввести этот код</strong> в своем профиле для подключения.
                            </p>
                            <Button
                                className={`${styles.copyAction} ${copiedType === 'code' ? styles.copied : ''}`}
                                onClick={() => handleCopy(referralCode, 'code')}
                            >
                                {copiedType === 'code' ? <Check size={18} /> : <Copy size={18} />}
                                {copiedType === 'code' ? 'Скопировано' : 'Копировать код'}
                            </Button>
                        </div>
                    </div>

                    <div className={styles.tipBox}>
                        <LinkIcon size={18} />
                        <span>Все данные ученика (имя, контакты) будут синхронизированы после подключения.</span>
                    </div>
                </div>
            </div>
        </Modal>
    )
}
