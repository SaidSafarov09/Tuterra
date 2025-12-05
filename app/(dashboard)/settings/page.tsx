'use client'

import React, { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Dropdown } from '@/components/ui/Dropdown'
import { UserAvatarUpload } from '@/components/ui/UserAvatarUpload'
import { UnsavedChangesModal } from '@/components/ui/UnsavedChangesModal'
import { settingsApi } from '@/services/api'
import { GENERAL_MESSAGES } from '@/constants/messages'
import { SettingsFormSkeleton } from '@/components/skeletons'
import { formatPhoneNumber } from '@/lib/validation'
import styles from './page.module.scss'
import { TABS, TIMEZONES } from '@/constants'


export default function SettingsPage() {
    const router = useRouter()
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
        avatar: null as string | null,
        timezone: 'Europe/Moscow',
    })

    useEffect(() => {
        fetchSettings()
    }, [])

    const fetchSettings = async () => {
        try {
            const data = await settingsApi.get()
            const initialData = {
                firstName: data.firstName || (data.name ? data.name.split(' ')[0] || '' : ''),
                lastName: data.lastName || (data.name ? data.name.split(' ').slice(1).join(' ') || '' : ''),
                email: data.email || '',
                phone: data.phone || '',
                avatar: data.avatar || null,
                timezone: data.timezone || 'Europe/Moscow',
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

    // Detect changes
    useEffect(() => {
        if (!initialDataRef.current) return

        const hasChanges = JSON.stringify(formData) !== JSON.stringify(initialDataRef.current)
        setHasUnsavedChanges(hasChanges)
    }, [formData])

    // Block navigation if there are unsaved changes
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
            // Format phone number automatically
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

    const handleTimezoneChange = (value: string) => {
        setFormData((prev) => ({ ...prev, timezone: value }))
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
            })

            // Update initial data ref to current data
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
        if (pendingNavigation) {
            router.push(pendingNavigation)
        }
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

            {isLoading ? (
                <SettingsFormSkeleton />
            ) : (
                <form onSubmit={handleSubmit} className={styles.form}>
                    {activeTab === 'general' && (
                        <>
                            <div className={styles.section}>
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
                                        <Input
                                            label="Телефон"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            placeholder="+7XXXXXXXXXX"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className={styles.section}>
                                <h2 className={styles.sectionTitle}>Региональные настройки</h2>
                                <div className={styles.appGrid}>
                                    <Dropdown
                                        label="Часовой пояс"
                                        value={formData.timezone}
                                        onChange={(value) => setFormData((prev) => ({ ...prev, timezone: value }))}
                                        options={TIMEZONES}
                                        searchable
                                        menuPosition="relative"
                                        onOpen={() => {
                                            setTimeout(() => {
                                                window.scrollBy({ top: 250, behavior: 'smooth' })
                                            }, 100)
                                        }}
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    {activeTab === 'appearance' && (
                        <div className={styles.section}>
                            <h2 className={styles.sectionTitle}>Оформление</h2>
                            <p style={{ color: 'var(--text-secondary)' }}>
                                Настройки оформления будут доступны в ближайшее время.
                            </p>
                        </div>
                    )}

                    <div className={styles.submitSection}>
                        <Button type="submit" disabled={isSaving}>
                            {isSaving ? 'Сохранение...' : 'Сохранить изменения'}
                        </Button>
                    </div>
                </form>
            )}

            <UnsavedChangesModal
                isOpen={showUnsavedModal}
                onClose={() => setShowUnsavedModal(false)}
                onDiscard={handleDiscardChanges}
            />
        </div>
    )
}
