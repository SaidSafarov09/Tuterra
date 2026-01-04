'use client'

import React, { useState } from 'react'
import { useAuthStore } from '@/store/auth'
import { Button } from '@/components/ui/Button'
import { Copy, Check, Gift, Share2, Users } from 'lucide-react'
import { toast } from 'sonner'
import styles from './ReferralSettings.module.scss'
import { useMediaQuery } from '@/hooks/useMediaQuery'

export const ReferralSettings: React.FC = () => {
    const { user } = useAuthStore()
    const [copied, setCopied] = useState(false)
    const isMobile = useMediaQuery('(max-width: 768px)')

    const referralCode = user?.referralCode || ''
    const referralLink = typeof window !== 'undefined'
        ? `${window.location.origin}/auth?ref=${referralCode}`
        : ''

    const handleCopy = async () => {
        if (!referralLink) return

        try {
            // Priority 1: Modern API
            if (navigator.clipboard) {
                await navigator.clipboard.writeText(referralLink)
            } else {
                throw new Error('Clipboard API unavailable')
            }
            setCopied(true)
            toast.success('Ссылка скопирована!')
            setTimeout(() => setCopied(false), 2000)
        } catch (err) {
            // Priority 2: Legacy fallback
            try {
                const textArea = document.createElement("textarea")
                textArea.value = referralLink
                document.body.appendChild(textArea)
                textArea.select()
                document.execCommand('copy')
                document.body.removeChild(textArea)

                setCopied(true)
                toast.success('Ссылка скопирована!')
                setTimeout(() => setCopied(false), 2000)
            } catch (fallbackErr) {
                toast.error('Не удалось скопировать ссылку')
            }
        }
    }

    const shareData = {
        title: 'Tuterra — ИТ-экосистема для репетиторов',
        text: 'Привет! Попробуй Tuterra для управления своими занятиями. По этой ссылке ты получишь 1 месяц PRO бесплатно.',
        url: referralLink,
    }

    const handleShare = async () => {
        // Try native share only on mobile, otherwise always copy
        if (isMobile && navigator.share) {
            try {
                await navigator.share(shareData)
            } catch (err) {
                if ((err as Error).name !== 'AbortError') {
                    handleCopy()
                }
            }
        } else {
            handleCopy()
        }
    }

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <div className={styles.header}>
                    <div className={styles.iconWrapper}>
                        <Gift size={isMobile ? 24 : 32} />
                    </div>
                    <div className={styles.headerText}>
                        <h3 className={styles.title}>Пригласите коллегу — получите месяц PRO</h3>
                        <p className={styles.description}>
                            Поделитесь ссылкой с другом. Как только он зарегистрируется и начнет пользоваться сервисом,
                            вы оба получите <strong>30 дней PRO-подписки</strong> бесплатно.
                        </p>
                    </div>
                </div>

                <div className={styles.linkSection}>
                    <div className={styles.linkLabel}>Ваша уникальная ссылка</div>
                    <div className={styles.linkWrapper}>
                        <input
                            type="text"
                            readOnly
                            value={referralLink}
                            className={styles.linkInput}
                            onClick={handleCopy}
                        />
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={handleCopy}
                            className={styles.copyBtn}
                        >
                            {copied ? <Check size={18} /> : <Copy size={18} />}
                            <span>{copied ? 'Готово' : 'Копировать'}</span>
                        </Button>
                    </div>
                </div>

                <div className={styles.stats}>
                    <div className={styles.statItem}>
                        <Users size={20} />
                        <div className={styles.statContent}>
                            <span className={styles.statValue}>{user?._count?.invitedUsers || 0}</span>
                            <span className={styles.statLabel}>Приглашено друзей</span>
                        </div>
                    </div>
                    <div className={styles.statSeparator} />
                    <div className={styles.statItem}>
                        <Gift size={20} />
                        <div className={styles.statContent}>
                            <span className={styles.statValue}>{(user?.bonusMonthsEarned || 0) * 30} дн.</span>
                            <span className={styles.statLabel}>Бонусных дней PRO</span>
                        </div>
                    </div>
                </div>

                <div className={styles.footer}>
                    <Button
                        type="button"
                        onClick={handleShare}
                        fullWidth
                        variant="primary"
                        className={styles.shareBtn}
                    >
                        <Share2 size={20} style={{ marginRight: '8px' }} />
                        Отправить приглашение
                    </Button>
                </div>
            </div>

            <div className={styles.infoGrid}>
                <div className={styles.infoCard}>
                    <h4>Как это работает?</h4>
                    <ol>
                        <li>Отправьте ссылку знакомому репетитору</li>
                        <li>Он регистрируется и <strong>сразу</strong> получает 30 дней PRO</li>
                        <li>Как только друг добавит 3 учеников и 5 уроков, вы тоже получите +30 дней PRO</li>
                    </ol>
                </div>
                <div className={styles.infoCard}>
                    <h4>Условия и лимиты</h4>
                    <p>
                        Мы поощряем реальное использование сервиса. Вы можете получить максимум
                        <strong> 90 бонусных дней PRO</strong> (за 3 приглашенных коллег).
                    </p>
                    <p style={{ marginTop: '12px', fontSize: '12px', opacity: 0.8 }}>
                        Активность друга проверяется автоматически в течение 24 часов.
                    </p>
                </div>
            </div>
        </div>
    )
}
