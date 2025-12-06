'use client'

import React, { useState, useRef } from 'react'
import * as Avatar from '@radix-ui/react-avatar'
import { toast } from 'sonner'
import { UploadIcon } from '@/components/icons/Icons'
import { Button } from '@/components/ui/Button'
import { Modal, ModalFooter } from '@/components/ui/Modal'
import { ImageCropper } from '@/components/ui/ImageCropper'
import { ImageViewer } from '@/components/ui/ImageViewer'
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
    const [selectedImage, setSelectedImage] = useState<string | null>(null)
    const [isViewerOpen, setIsViewerOpen] = useState(false)
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
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

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        let file = event.target.files?.[0]
        if (file) {
            if (file.size > 10 * 1024 * 1024) {
                toast.error('Размер файла не должен превышать 10MB')
                return
            }

            if (file.type === 'image/heic' || file.type === 'image/heif' || file.name.toLowerCase().endsWith('.heic')) {
                const toastId = toast.loading('Обработка фото...')
                try {
                    const heic2any = (await import('heic2any')).default
                    const convertedBlob = await heic2any({
                        blob: new Blob([file], { type: 'image/heic' }),
                        toType: 'image/jpeg',
                        quality: 0.8
                    })

                    const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob
                    file = new File([blob], file.name.replace(/\.heic$/i, '.jpg'), { type: 'image/jpeg' })
                    toast.dismiss(toastId)
                } catch (e) {
                    try {
                        const url = URL.createObjectURL(file)
                        const img = new Image()
                        await new Promise((resolve, reject) => {
                            img.onload = resolve
                            img.onerror = reject
                            img.src = url
                        })
                        // If we get here, the browser supports it natively
                        // We don't need to do anything, just proceed to reader
                        toast.dismiss(toastId)
                    } catch (imgError) {
                        toast.dismiss(toastId)
                        toast.error('Этот формат HEIC не поддерживается. Пожалуйста, используйте JPG или PNG.')
                        return
                    }
                }
            } else if (!file.type.startsWith('image/')) {
                toast.error('Можно загрузить только изображения')
                return
            }

            const reader = new FileReader()
            reader.onloadend = () => {
                setSelectedImage(reader.result as string)
            }
            reader.readAsDataURL(file)

            event.target.value = ''
        }
    }

    const handleCropComplete = async (croppedImage: string) => {
        setPreview(croppedImage)
        setSelectedImage(null)

        // Convert base64 to File object
        const res = await fetch(croppedImage)
        const blob = await res.blob()
        const file = new File([blob], "avatar.jpg", { type: "image/jpeg" })

        onAvatarChange?.(file)
    }

    const handleClick = () => {
        fileInputRef.current?.click()
    }

    const handleRemoveRequest = () => {
        setIsDeleteModalOpen(true)
    }

    const handleConfirmRemove = () => {
        setPreview(null)
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
        onAvatarChange?.(null as any)
        setIsDeleteModalOpen(false)
    }

    // Generate stable color from string
    const stringToColor = (str: string): string => {
        let hash = 0
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash)
        }

        const hue = Math.abs(hash % 360)
        return `hsl(${hue}, 65%, 55%)`
    }

    const avatarBgColor = userName ? stringToColor(userName) : 'var(--primary)'

    return (
        <>
            <div className={styles.container}>
                <div
                    className={styles.avatarWrapper}
                    onClick={() => preview && setIsViewerOpen(true)}
                    style={{ cursor: preview ? 'pointer' : 'default' }}
                >
                    <Avatar.Root className={styles.avatarRoot}>
                        <Avatar.Image className={styles.avatarImage} src={preview || undefined} alt={userName || 'User'} />
                        <Avatar.Fallback
                            className={styles.avatarFallback}
                            style={{ backgroundColor: avatarBgColor }}
                        >
                            {getInitials(userName)}
                        </Avatar.Fallback>
                    </Avatar.Root>
                </div>

                <div className={styles.actions}>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className={styles.fileInput}
                    />
                    <Button size="small" onClick={handleClick} type="button">
                        <UploadIcon size={16} />
                        Загрузить фото
                    </Button>
                    {preview && (
                        <Button variant="ghost" size="small" onClick={handleRemoveRequest} type="button">
                            Удалить
                        </Button>
                    )}
                </div>
                <p className={styles.hint}>Рекомендуемый размер: 200x200px, максимум 5MB</p>
            </div>

            {selectedImage && (
                <ImageCropper
                    imageSrc={selectedImage}
                    onCropComplete={handleCropComplete}
                    onCancel={() => setSelectedImage(null)}
                />
            )}

            {isViewerOpen && preview && (
                <ImageViewer
                    src={preview}
                    onClose={() => setIsViewerOpen(false)}
                />
            )}

            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title="Удалить фото?"
            >
                <p>Вы уверены, что хотите удалить фотографию профиля? Это действие нельзя отменить.</p>
                <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                    <ModalFooter
                        onCancel={() => setIsDeleteModalOpen(false)}
                        onSubmit={handleConfirmRemove}
                        submitText="Удалить"
                        variant="danger"
                    />
                </div>
            </Modal>
        </>
    )
}
