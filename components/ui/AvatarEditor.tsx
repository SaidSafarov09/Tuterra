'use client'

import React, { useState, useEffect } from 'react'
import { UserIcon, ScissorsIcon, EyeIcon, PaletteIcon } from '@/components/icons/Icons'
import { StudentAvatar, avatarOptions } from './StudentAvatar'
import { Button } from './Button'
import styles from './AvatarEditor.module.scss'

interface AvatarConfig {
    skinColor: string
    hairStyle: string
    hairColor: string
    eyeStyle: string
    accessory: string
    bgColor: string
}

interface AvatarEditorProps {
    initialConfig?: Partial<AvatarConfig>
    onChange: (config: AvatarConfig) => void
}

const defaultConfig: AvatarConfig = {
    skinColor: '#F4C2A6',
    hairStyle: 'short',
    hairColor: '#2C1B18',
    eyeStyle: 'default',
    accessory: 'none',
    bgColor: '#E3F2FD',
}

export const AvatarEditor: React.FC<AvatarEditorProps> = ({
    initialConfig,
    onChange,
}) => {
    const [config, setConfig] = useState<AvatarConfig>({
        ...defaultConfig,
        ...initialConfig,
    })

    const [activeTab, setActiveTab] = useState<'base' | 'hair' | 'face' | 'bg'>('base')

    useEffect(() => {
        onChange(config)
    }, [config, onChange])

    const updateConfig = (key: keyof AvatarConfig, value: string) => {
        setConfig((prev) => ({ ...prev, [key]: value }))
    }

    const tabs = [
        { id: 'base', label: 'База', icon: <UserIcon size={18} /> },
        { id: 'hair', label: 'Волосы', icon: <ScissorsIcon size={18} /> },
        { id: 'face', label: 'Лицо', icon: <EyeIcon size={18} /> },
        { id: 'bg', label: 'Фон', icon: <PaletteIcon size={18} /> },
    ]

    return (
        <div className={styles.container}>
            <div className={styles.preview}>
                <StudentAvatar
                    {...config}
                    size={120}
                    className={styles.avatar}
                />
            </div>

            <div className={styles.editor}>
                <div className={styles.tabs}>
                    {tabs.map((tab) => (
                        <button
                            key={tab?.id}
                            className={`${styles.tab} ${activeTab === tab?.id ? styles.activeTab : ''}`}
                            onClick={() => setActiveTab(tab?.id as any)}
                            type="button"
                        >
                            <span className={styles.tabIcon}>{tab.icon}</span>
                            <span className={styles.tabLabel}>{tab.label}</span>
                        </button>
                    ))}
                </div>

                <div className={styles.controls}>
                    {activeTab === 'base' && (
                        <div className={styles.controlGroup}>
                            <label className={styles.label}>Цвет кожи</label>
                            <div className={styles.colorGrid}>
                                {avatarOptions.skinColors.map((option) => (
                                    <button
                                        key={option.value}
                                        className={`${styles.colorOption} ${config.skinColor === option.value ? styles.selected : ''}`}
                                        style={{ backgroundColor: option.value }}
                                        onClick={() => updateConfig('skinColor', option.value)}
                                        type="button"
                                        title={option.name}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'hair' && (
                        <>
                            <div className={styles.controlGroup}>
                                <label className={styles.label}>Прическа</label>
                                <div className={styles.optionsGrid}>
                                    {avatarOptions.hairStyles.map((option) => (
                                        <button
                                            key={option.value}
                                            className={`${styles.textOption} ${config.hairStyle === option.value ? styles.selected : ''}`}
                                            onClick={() => updateConfig('hairStyle', option.value)}
                                            type="button"
                                        >
                                            {option.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className={styles.controlGroup}>
                                <label className={styles.label}>Цвет волос</label>
                                <div className={styles.colorGrid}>
                                    {avatarOptions.hairColors.map((option) => (
                                        <button
                                            key={option.value}
                                            className={`${styles.colorOption} ${config.hairColor === option.value ? styles.selected : ''}`}
                                            style={{ backgroundColor: option.value }}
                                            onClick={() => updateConfig('hairColor', option.value)}
                                            type="button"
                                            title={option.name}
                                        />
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    {activeTab === 'face' && (
                        <>
                            <div className={styles.controlGroup}>
                                <label className={styles.label}>Глаза</label>
                                <div className={styles.optionsGrid}>
                                    {avatarOptions.eyeStyles.map((option) => (
                                        <button
                                            key={option.value}
                                            className={`${styles.textOption} ${config.eyeStyle === option.value ? styles.selected : ''}`}
                                            onClick={() => updateConfig('eyeStyle', option.value)}
                                            type="button"
                                        >
                                            {option.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className={styles.controlGroup}>
                                <label className={styles.label}>Аксессуары</label>
                                <div className={styles.optionsGrid}>
                                    {avatarOptions.accessories.map((option) => (
                                        <button
                                            key={option.value}
                                            className={`${styles.textOption} ${config.accessory === option.value ? styles.selected : ''}`}
                                            onClick={() => updateConfig('accessory', option.value)}
                                            type="button"
                                        >
                                            {option.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    {activeTab === 'bg' && (
                        <div className={styles.controlGroup}>
                            <label className={styles.label}>Цвет фона</label>
                            <div className={styles.colorGrid}>
                                {avatarOptions.bgColors.map((option) => (
                                    <button
                                        key={option.value}
                                        className={`${styles.colorOption} ${config.bgColor === option.value ? styles.selected : ''}`}
                                        style={{ backgroundColor: option.value }}
                                        onClick={() => updateConfig('bgColor', option.value)}
                                        type="button"
                                        title={option.name}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
