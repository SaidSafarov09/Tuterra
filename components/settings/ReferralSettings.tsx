'use client'

import React, { useState } from 'react'
import { useAuthStore } from '@/store/auth'
import { Button } from '@/components/ui/Button'
import { Copy, Check, Gift, Share2, Users, Ticket } from 'lucide-react'
import { toast } from 'sonner'
import styles from './ReferralSettings.module.scss'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { PartnerPromoInput } from '@/components/ui/PartnerPromoInput'

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


            {user?.invitedUsers && user.invitedUsers.length > 0 && (
                <div className={styles.invitedSection}>
                    <h3 className={styles.sectionTitle}>Приглашенные друзья</h3>
                    <div className={styles.invitedList}>
                        {user.invitedUsers.map((friend) => {
                            const studentProgress = Math.min((friend._count.students / 3) * 100, 100)
                            const lessonProgress = Math.min((friend._count.lessons / 5) * 100, 100)
                            const isClaimed = friend.referralBonusClaimed

                            return (
                                <div key={friend.id} className={styles.friendCard}>
                                    <div className={styles.friendHeader}>
                                        <div className={styles.friendAvatar}>
                                            {friend.avatar ? (
                                                <img src={friend.avatar} alt={friend.firstName || ''} className={styles.avatarImg} />
                                            ) : (
                                                (friend.firstName?.[0] || friend.lastName?.[0] || '?').toUpperCase()
                                            )}
                                        </div>
                                        <div className={styles.friendInfo}>
                                            <div className={styles.friendName}>
                                                {friend.firstName} {friend.lastName}
                                            </div>
                                            <div className={styles.friendDate}>
                                                Присоединился {new Date(friend.createdAt).toLocaleDateString('ru-RU')}
                                            </div>
                                        </div>
                                        {isClaimed ? (
                                            <div className={styles.statusBadge}>Готово</div>
                                        ) : (
                                            <div className={styles.statusBadgeActive}>В процессе</div>
                                        )}
                                    </div>

                                    {!isClaimed && (
                                        <div className={styles.progressContainer}>
                                            <div className={styles.progressItem}>
                                                <div className={styles.progressLabel}>
                                                    <span>Ученики</span>
                                                    <span>{friend._count.students}/3</span>
                                                </div>
                                                <div className={styles.progressBar}>
                                                    <div
                                                        className={styles.progressFill}
                                                        style={{ width: `${studentProgress}%` }}
                                                    />
                                                </div>
                                            </div>
                                            <div className={styles.progressItem}>
                                                <div className={styles.progressLabel}>
                                                    <span>Уроки</span>
                                                    <span>{friend._count.lessons}/5</span>
                                                </div>
                                                <div className={styles.progressBar}>
                                                    <div
                                                        className={styles.progressFill}
                                                        style={{ width: `${lessonProgress}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}
            <div className={styles.card}>
                <div className={styles.header}>
                    <div className={styles.iconWrapper} style={{ background: 'rgba(74, 108, 247, 0.1)', color: 'var(--primary)' }}>
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

            {/* My Promo Codes Section */}
            <div className={`${styles.card} ${styles.promoCard}`}>
                <div className={styles.header}>
                    <div className={styles.iconWrapper} style={{ background: 'rgba(56, 189, 248, 0.1)', color: '#0ea5e9' }}>
                        <Ticket size={isMobile ? 24 : 32} />
                    </div>
                    <div className={styles.headerText}>
                        <h3 className={styles.title}>Промокоды</h3>
                        <p className={styles.description}>
                            Используйте промокоды для получения скидок и специальных условий на подписку PRO.
                        </p>
                    </div>
                </div>

                {/* Promo Code Input - Always visible so user can try entering new codes (e.g. system codes) */}
                <div className={styles.promoInputSection}>
                    <PartnerPromoInput
                        placeholder="Введите промокод"
                        hideInputWhenApplied={false}
                    />
                </div>


                {/* ACTIVE: Applied but NOT yet used for any payment (count is 0 or null) */}
                {user?.invitedByPartnerCode && (!user.partnerPaymentsCount || user.partnerPaymentsCount === 0) && (
                    <div className={styles.activePromoStatus}>
                        <div className={styles.promoStatusBadge}>
                            <Check size={14} />
                            <span>Промокод <strong>{user.invitedByPartnerCode}</strong> активен и будет применен при следующей оплате</span>
                        </div>
                    </div>
                )}

                {/* USED / HISTORY: Has code AND has made at least one payment */}
                {user?.invitedByPartnerCode && user.partnerPaymentsCount && user.partnerPaymentsCount > 0 && (
                    <div className={styles.promoHistory}>
                        <h4 className={styles.historyTitle}>История промокодов</h4>
                        <div className={styles.usedPromoCard}>
                            <div className={styles.usedPromoInfo}>
                                <span className={styles.usedPromoCode}>{user.invitedByPartnerCode}</span>
                                <span className={styles.usedStatusBadge}>Использован</span>
                            </div>
                            {user.invitedByPartnerAt && (
                                <div className={styles.usedDate}>
                                    Применен: {new Date(user.invitedByPartnerAt).toLocaleDateString('ru-RU')}
                                </div>
                            )}
                        </div>
                    </div>
                )}

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
