'use client'

import React, { useEffect, useState, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Dropdown } from '@/components/ui/Dropdown'
import { UserAvatarUpload } from '@/components/ui/UserAvatarUpload'
import { UnsavedChangesModal } from '@/components/ui/UnsavedChangesModal'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { settingsApi } from '@/services/api'
import { NotificationSettings } from '@/components/settings/NotificationSettings'
import { GENERAL_MESSAGES } from '@/constants/messages'
import { SettingsFormSkeleton } from '@/components/skeletons'
import { formatPhoneNumber } from '@/lib/validation'
import styles from './page.module.scss'
import { TABS, TIMEZONES, REGIONS } from '@/constants'
import { AnimatePresence, motion } from 'framer-motion'

interface SettingsPageProps {
    onLeaveSettings?: () => void
}

function SettingsContent({ onLeaveSettings }: SettingsPageProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { user, setUser } = useAuthStore()
    const [activeTab, setActiveTab] = useState('general')
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
    const [showUnsavedModal, setShowUnsavedModal] = useState(false)
    const [pendingNavigation, setPendingNavigation] = useState<string | null>(null)
    const [hasOAuthProvider, setHasOAuthProvider] = useState(false)
    const initialDataRef = useRef<any>(null)
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        birthDate: '',
        avatar: null as string | null,
        timezone: 'Europe/Moscow',
        region: 'all',
        notificationSettings: {
            lessonReminders: true,
            unpaidLessons: true,
            statusChanges: true,
            incomeReports: true,
            studentDebts: true,
            missingLessons: true,
            onboardingTips: true,
            deliveryWeb: true,
            deliveryTelegram: false,
            quietHoursEnabled: false,
            quietHoursStart: '22:00',
            quietHoursEnd: '08:00',
        },
        telegramId: null as string | null,
    })

    useEffect(() => {
        const tab = searchParams.get('tab')
        if (tab && TABS.some(t => t.id === tab)) {
            setActiveTab(tab)
        }
        fetchSettings()
    }, [searchParams])

    useEffect(() => {
        const handleScrollToSection = () => {
            if (typeof window !== 'undefined' && !isLoading && activeTab === 'general') {
                const hash = window.location.hash
                if (hash === '#telegram' || hash === '#telegram-section') {
                    // Увеличиваем задержку, так как AnimatePresence/motion может еще анимироваться
                    setTimeout(() => {
                        const el = document.getElementById('telegram-section')
                        if (el) {
                            el.scrollIntoView({ behavior: 'smooth', block: 'center' })
                            // Подсвечиваем блок
                            el.style.transition = 'box-shadow 0.3s, border-color 0.3s'
                            el.style.boxShadow = '0 0 0 2px var(--primary), 0 0 20px rgba(59, 130, 246, 0.3)'
                            el.style.borderColor = 'var(--primary)'
                            setTimeout(() => {
                                el.style.boxShadow = ''
                                el.style.borderColor = ''
                            }, 3000)
                        }
                    }, 800)
                }
            }
        }

        handleScrollToSection()
        window.addEventListener('hashchange', handleScrollToSection)
        return () => window.removeEventListener('hashchange', handleScrollToSection)
    }, [isLoading, activeTab])

    const fetchSettings = async () => {
        try {
            const [data, telegramData] = await Promise.all([
                settingsApi.get(),
                fetch('/api/user/telegram-status', { cache: 'no-store' }).then(res => res.json())
            ])

            console.log('Fetched Settings:', data)
            console.log('Telegram Status:', telegramData)

            const initialData = {
                firstName: data.firstName || (data.name ? data.name.split(' ')[0] || '' : ''),
                lastName: data.lastName || (data.name ? data.name.split(' ').slice(1).join(' ') || '' : ''),
                email: data.email || '',
                phone: data.phone || '',
                birthDate: data.birthDate ? new Date(data.birthDate).toISOString().split('T')[0] : '',
                avatar: data.avatar || null,
                timezone: data.timezone || 'Europe/Moscow',
                region: data.region || 'all',
                notificationSettings: data.notificationSettings || {
                    lessonReminders: true,
                    unpaidLessons: true,
                    statusChanges: true,
                    incomeReports: true,
                    studentDebts: true,
                    missingLessons: true,
                    onboardingTips: true,
                    deliveryWeb: true,
                    deliveryTelegram: false,
                    quietHoursEnabled: false,
                    quietHoursStart: '22:00',
                    quietHoursEnd: '08:00',
                },
                telegramId: telegramData.telegramId || data.telegramId || null,
            }
            setFormData(initialData)
            initialDataRef.current = initialData
            setHasOAuthProvider(data.hasOAuthProvider || false)
        } catch (error) {
            toast.error('Не удалось загрузить настройки')
        } finally {
            setIsLoading(false)
        }
    }


    useEffect(() => {
        if (!initialDataRef.current) return

        const hasChanges = JSON.stringify(formData) !== JSON.stringify(initialDataRef.current)
        setHasUnsavedChanges(hasChanges)
    }, [formData])


    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (hasUnsavedChanges) {
                e.preventDefault()
                e.returnValue = ''
            }
        }

        const handleClick = (e: MouseEvent) => {
            if (!hasUnsavedChanges) return

            const target = e.target as HTMLElement
            const link = target.closest('a')

            if (link && link.href && !link.href.includes('/settings')) {
                e.preventDefault()
                e.stopPropagation()
                setPendingNavigation(link.pathname || link.href)
                setShowUnsavedModal(true)
            }
        }

        window.addEventListener('beforeunload', handleBeforeUnload)
        document.addEventListener('click', handleClick, true)

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload)
            document.removeEventListener('click', handleClick, true)
        }
    }, [hasUnsavedChanges])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target

        if (name === 'phone') {

            const formatted = formatPhoneNumber(value)
            setFormData((prev) => ({ ...prev, [name]: formatted }))
        } else {
            setFormData((prev) => ({ ...prev, [name]: value }))
        }
    }

    const handleAvatarChange = (file: File | null) => {
        if (file) {
            const reader = new FileReader()
            reader.onloadend = () => {
                setFormData((prev) => ({ ...prev, avatar: reader.result as string }))
            }
            reader.readAsDataURL(file)
        } else {
            setFormData((prev) => ({ ...prev, avatar: null }))
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSaving(true)

        try {
            const updatedUser = await settingsApi.update(formData)

            setUser({
                ...user!,
                firstName: updatedUser.firstName,
                lastName: updatedUser.lastName,
                name: updatedUser.name || null,
                email: updatedUser.email || null,
                phone: updatedUser.phone || null,
                avatar: updatedUser.avatar || null,
                birthDate: updatedUser.birthDate || null,
                region: updatedUser.region || null,
            })


            initialDataRef.current = { ...formData }
            setHasUnsavedChanges(false)

            const event = new Event('visibilitychange');
            document.dispatchEvent(event);

            toast.success(GENERAL_MESSAGES.SAVED)
        } catch (error: any) {
            toast.error(error.message || GENERAL_MESSAGES.GENERIC_ERROR)
        } finally {
            setIsSaving(false)
        }
    }

    const handleDiscardChanges = () => {
        setShowUnsavedModal(false)
        setHasUnsavedChanges(false)
        window.dispatchEvent(new CustomEvent('closeMobileSidebar'))
        if (pendingNavigation) {
            router.push(pendingNavigation)
        }
    }

    const handleConnectTelegram = async () => {
        try {
            const res = await settingsApi.generateTelegramAuthCode()
            if (res.code) {
                window.open(`https://t.me/TuterraBot?start=${res.code}`, '_blank')
            } else {
                toast.error('Не удалось получить код привязки')
            }
        } catch (e) {
            toast.error('Ошибка при подключении Telegram')
        }
    }

    const handleStayOnPage = () => {
        setShowUnsavedModal(false)
        window.dispatchEvent(new CustomEvent('closeMobileSidebar'))
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Настройки</h1>
                <p className={styles.subtitle}>Управление профилем и предпочтениями</p>
            </div>

            <div className={styles.tabs}>
                {TABS.map((tab) => (
                    <button
                        key={tab.id}
                        className={`${styles.tab} ${activeTab === tab.id ? styles.active : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <AnimatePresence mode="wait">
                {isLoading ? (
                    <motion.div
                        key="skeleton"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <SettingsFormSkeleton />
                    </motion.div>
                ) : (
                    <motion.form
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        onSubmit={handleSubmit}
                        className={styles.form}
                    >
                        {activeTab === 'general' && (
                            <>
                                <div className={styles.section} data-onboarding="profile-settings">
                                    <h2 className={styles.sectionTitle}>Профиль</h2>
                                    <div className={styles.profileGrid}>
                                        <div className={styles.avatarColumn}>
                                            <UserAvatarUpload
                                                currentAvatar={formData.avatar}
                                                userName={`${formData.firstName} ${formData.lastName}`.trim()}
                                                onAvatarChange={handleAvatarChange}
                                            />
                                        </div>
                                        <div className={styles.fieldsColumn}>
                                            <div className={styles.nameFields}>
                                                <Input
                                                    label="Имя"
                                                    name="firstName"
                                                    value={formData.firstName}
                                                    onChange={handleChange}
                                                    required
                                                />
                                                <Input
                                                    label="Фамилия"
                                                    name="lastName"
                                                    value={formData.lastName}
                                                    onChange={handleChange}
                                                    required
                                                />
                                            </div>
                                            <Input
                                                label="Email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleChange}
                                                disabled={hasOAuthProvider}
                                                hint={hasOAuthProvider ? "Email нельзя изменить (вход через соцсеть)" : undefined}
                                            />
                                            <div className={styles.nameFields}>
                                                <Input
                                                    label="Телефон"
                                                    name="phone"
                                                    value={formData.phone}
                                                    onChange={handleChange}
                                                    placeholder="+7XXXXXXXXXX"
                                                />
                                                <Input
                                                    label="Дата рождения"
                                                    name="birthDate"
                                                    type="date"
                                                    value={formData.birthDate || ''}
                                                    onChange={handleChange}
                                                    min="1940-01-01"
                                                    max={new Date(Date.now() - 86400000).toISOString().split('T')[0]}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className={styles.section}>
                                    <h2 className={styles.sectionTitle}>Региональные настройки</h2>
                                    <div className={styles.appGrid}>
                                        <Dropdown
                                            label="Регион (Субъект РФ)"
                                            value={formData.region}
                                            onChange={(value) => setFormData((prev) => ({ ...prev, region: value }))}
                                            options={REGIONS}
                                            searchable
                                            placeholderSearch="Поиск..."
                                            menuPosition="top"
                                            hint="Выберите вашу республику - мы покажем в календаре дополнительные региональные выходные."
                                        />
                                        <Dropdown
                                            label="Часовой пояс"
                                            value={formData.timezone}
                                            onChange={(value) => setFormData((prev) => ({ ...prev, timezone: value }))}
                                            options={TIMEZONES}
                                            searchable
                                            placeholderSearch="Поиск..."
                                            menuPosition="top"
                                            onOpen={() => {
                                                setTimeout(() => {
                                                    window.scrollBy({ top: 250, behavior: 'smooth' })
                                                }, 100)
                                            }}
                                        />
                                    </div>
                                </div>

                                <div className={styles.section} id="telegram-section" data-onboarding="telegram-integration">
                                    <h2 className={styles.sectionTitle}>Привязать Telegram</h2>
                                    <div style={{
                                        padding: '24px',
                                        background: 'var(--bg-secondary)',
                                        borderRadius: '16px',
                                        border: '1px solid var(--border-light)'
                                    }}>
                                        {formData.telegramId ? (
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--success)' }}>
                                                    <div style={{
                                                        width: '32px', height: '32px', borderRadius: '50%', background: 'var(--success-50)',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                                                    }}>
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                            <polyline points="20 6 9 17 4 12"></polyline>
                                                        </svg>
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: 600, fontSize: '15px' }}>Telegram подключен</div>
                                                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Бот синхронизирован с вашим аккаунтом</div>
                                                    </div>
                                                </div>
                                                <Button
                                                    type="button"
                                                    onClick={() => window.open('https://t.me/TuterraBot', '_blank')}
                                                    style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                                                >
                                                    Перейти в бота
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '8px' }}>
                                                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                                                        <polyline points="15 3 21 3 21 9"></polyline>
                                                        <line x1="10" y1="14" x2="21" y2="3"></line>
                                                    </svg>
                                                </Button>
                                            </div>
                                        ) : (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'flex-start' }}>
                                                <div>
                                                    <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 600 }}>Tuterra Bot</h3>
                                                    <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                                                        Подключите нашего бота, чтобы получать уведомления о занятиях и оплатах, а также управлять расписанием прямо из мессенджера.
                                                    </p>
                                                </div>
                                                <Button type="button" onClick={handleConnectTelegram} style={{ background: '#229ED9', borderColor: '#229ED9', color: '#fff' }}>
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
                                                        <path d="M22 2L11 13"></path>
                                                        <path d="M22 2l-7 20-4-9-9-4 20-7z"></path>
                                                    </svg>
                                                    Подключить Telegram
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}

                        {activeTab === 'notifications' && (
                            <div className={styles.section}>
                                <h2 className={styles.sectionTitle}>Уведомления</h2>
                                <NotificationSettings
                                    settings={formData.notificationSettings}
                                    onChange={(newSettings) => setFormData(prev => ({
                                        ...prev,
                                        notificationSettings: { ...prev.notificationSettings, ...newSettings }
                                    }))}
                                />
                            </div>
                        )}

                        {activeTab === 'appearance' && (
                            <div className={styles.section}>
                                <h2 className={styles.sectionTitle}>Оформление</h2>
                                <div className={styles.appGrid}>
                                    <ThemeToggle />
                                </div>
                            </div>
                        )}

                        <div className={styles.submitSection}>
                            <Button type="submit" disabled={isSaving}>
                                {isSaving ? 'Сохранение...' : 'Сохранить изменения'}
                            </Button>
                        </div>
                    </motion.form>
                )}
            </AnimatePresence>

            <UnsavedChangesModal
                isOpen={showUnsavedModal}
                onClose={handleStayOnPage}
                onDiscard={handleDiscardChanges}
            />
        </div>
    )
}

export default function SettingsPage(props: SettingsPageProps) {
    return (
        <Suspense fallback={<SettingsFormSkeleton />}>
            <SettingsContent {...props} />
        </Suspense>
    )
}
