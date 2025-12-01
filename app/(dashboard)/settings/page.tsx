'use client'

import React, { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Dropdown } from '@/components/ui/Dropdown'
import { UserAvatarUpload } from '@/components/ui/UserAvatarUpload'
import { settingsApi } from '@/services/api'
import { GENERAL_MESSAGES } from '@/constants/messages'
import { SettingsFormSkeleton } from '@/components/skeletons'
import styles from './page.module.scss'
import { TABS, TIMEZONES } from '@/constants'


export default function SettingsPage() {
    const { data: session, update } = useSession()
    const [activeTab, setActiveTab] = useState('general')
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
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
            setFormData({
                name: data.name || '',
                email: data.email || '',
                phone: data.phone || '',
                avatar: data.avatar || null,
                timezone: data.timezone || 'Europe/Moscow',
            })
        } catch (error) {
            toast.error('Не удалось загрузить настройки')
        } finally {
            setIsLoading(false)
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData((prev) => ({ ...prev, [name]: value }))
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

            await update({
                ...session,
                user: {
                    ...session?.user,
                    name: updatedUser.name,
                    image: `/api/user/avatar?t=${Date.now()}`,
                },
            })

            const event = new Event('visibilitychange');
            document.dispatchEvent(event);

            toast.success(GENERAL_MESSAGES.SAVED)
        } catch (error: any) {
            toast.error(error.message || GENERAL_MESSAGES.GENERIC_ERROR)
        } finally {
            setIsSaving(false)
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
                                            userName={formData.name}
                                            onAvatarChange={handleAvatarChange}
                                        />
                                    </div>
                                    <div className={styles.fieldsColumn}>
                                        <Input
                                            label="Имя"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            required
                                        />
                                        <Input
                                            label="Email"
                                            name="email"
                                            value={formData.email}
                                            disabled
                                            hint="Email нельзя изменить"
                                        />
                                        <Input
                                            label="Телефон"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            placeholder="+7 (999) 000-00-00"
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
        </div>
    )
}
