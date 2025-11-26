'use client'

import React, { useState, useRef } from 'react'
import * as Avatar from '@radix-ui/react-avatar'
import { toast } from 'sonner'
import { UploadIcon } from '@/components/icons/Icons'
import { Button } from '@/components/ui/Button'
import styles from './UserAvatarUpload.module.scss'

interface UserAvatarUploadProps {
    currentAvatar?: string | null
    userName?: string | null
    onAvatarChange?: (file: File) => void
}

export const UserAvatarUpload: React.FC<UserAvatarUploadProps> = ({
    currentAvatar,
    userName,
    onAvatarChange,
}) => {
    const [preview, setPreview] = useState<string | null>(currentAvatar || null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const getInitials = (name?: string | null) => {
        if (!name) return '?'
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)
    }

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file) {
            // Проверка размера файла (максимум 2MB)
            if (file.size > 2 * 1024 * 1024) {
                toast.error('Размер файла не должен превышать 2MB')
                return
            }

            // Проверка типа файла
            if (!file.type.startsWith('image/')) {
                toast.error('Можно загрузить только изображения')
                return
            }

            // Создаем preview
            const reader = new FileReader()
            reader.onloadend = () => {
                setPreview(reader.result as string)
            }
            reader.readAsDataURL(file)

            onAvatarChange?.(file)
        }
    }

    const handleClick = () => {
        fileInputRef.current?.click()
    }

    const handleRemove = () => {
        setPreview(null)
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
        onAvatarChange?.(null as any)
    }

    return (
        <div className={styles.container}>
            <Avatar.Root className={styles.avatarRoot}>
                <Avatar.Image className={styles.avatarImage} src={preview || undefined} alt={userName || 'User'} />
                <Avatar.Fallback className={styles.avatarFallback}>
                    {getInitials(userName)}
                </Avatar.Fallback>
            </Avatar.Root>

            <div className={styles.actions}>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className={styles.fileInput}
                />
                <Button size="small" onClick={handleClick}>
                    <UploadIcon size={16} />
                    Загрузить фото
                </Button>
                {preview && (
                    <Button variant="ghost" size="small" onClick={handleRemove}>
                        Удалить
                    </Button>
                )}
            </div>
            <p className={styles.hint}>Рекомендуемый размер: 200x200px, максимум 2MB</p>
        </div>
    )
}
