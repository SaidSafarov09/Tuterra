'use client'

import React, { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Dropdown } from '@/components/ui/Dropdown'
import { UserAvatarUpload } from '@/components/ui/UserAvatarUpload'
import styles from './page.module.scss'

const TIMEZONES = [
    { value: 'Europe/Moscow', label: 'Москва (UTC+3)' },
    { value: 'Europe/Kaliningrad', label: 'Калининград (UTC+2)' },
    { value: 'Europe/Samara', label: 'Самара (UTC+4)' },
    { value: 'Asia/Yekaterinburg', label: 'Екатеринбург (UTC+5)' },
    { value: 'Asia/Omsk', label: 'Омск (UTC+6)' },
    { value: 'Asia/Novosibirsk', label: 'Новосибирск (UTC+7)' },
    { value: 'Asia/Irkutsk', label: 'Иркутск (UTC+8)' },
    { value: 'Asia/Yakutsk', label: 'Якутск (UTC+9)' },
    { value: 'Asia/Vladivostok', label: 'Владивосток (UTC+10)' },
]

const TABS = [
    { id: 'general', label: 'Основные' },
    { id: 'appearance', label: 'Оформление' },
]

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
            const response = await fetch('/api/settings')
            if (response.ok) {
                const data = await response.json()
                setFormData({
                    name: data.name || '',
                    email: data.email || '',
                    phone: data.phone || '',
                    avatar: data.avatar || null,
                    timezone: data.timezone || 'Europe/Moscow',
                })
            } else {
                toast.error('Не удалось загрузить настройки')
            }
        } catch (error) {
            toast.error('Произошла ошибка при загрузке настроек')
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSaving(true)

        try {
            const response = await fetch('/api/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    currency: 'RUB', // Default currency since we removed it from UI
                }),
            })

            if (response.ok) {
                const updatedUser = await response.json()

                // Force session update
                await update({
                    ...session,
                    user: {
                        ...session?.user,
                        name: updatedUser.name,
                        image: updatedUser.avatar,
                    },
                })

                // Trigger a hard reload of the session to ensure sidebar updates
                // This is a workaround if update() doesn't propagate immediately
                const event = new Event('visibilitychange');
                document.dispatchEvent(event);

                toast.success('Настройки успешно сохранены')
            } else {
                const data = await response.json()
                toast.error(data.error || 'Произошла ошибка')
            }
        } catch (error) {
            toast.error('Произошла ошибка при сохранении')
        } finally {
            setIsSaving(false)
        }
    }

    if (isLoading) {
        return <div className={styles.loading}>Загрузка...</div>
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
        </div>
    )
}
