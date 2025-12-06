'use client'

import React, { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import { Button } from '@/components/ui/Button'
import { Minus, Plus } from 'lucide-react'
import styles from './ImageCropper.module.scss'
import { getCroppedImg } from '@/lib/imageUtils'

interface ImageCropperProps {
    imageSrc: string
    onCropComplete: (croppedImage: string) => void
    onCancel: () => void
}

export const ImageCropper: React.FC<ImageCropperProps> = ({
    imageSrc,
    onCropComplete,
    onCancel
}) => {
    const [crop, setCrop] = useState({ x: 0, y: 0 })
    const [zoom, setZoom] = useState(1)
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(false)

    const onCropChange = (crop: { x: number; y: number }) => {
        setCrop(crop)
    }

    const onZoomChange = (zoom: number) => {
        setZoom(zoom)
    }

    const onCropCompleteHandler = useCallback((croppedArea: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels)
    }, [])

    const handleSave = async () => {
        setIsLoading(true)
        try {
            const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels)
            if (croppedImage) {
                onCropComplete(croppedImage)
            }
        } catch (e) {
            console.error(e)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className={styles.overlay}>
            <div className={styles.container}>
                <div className={styles.cropContainer}>
                    <Cropper
                        image={imageSrc}
                        crop={crop}
                        zoom={zoom}
                        aspect={1}
                        onCropChange={onCropChange}
                        onCropComplete={onCropCompleteHandler}
                        onZoomChange={onZoomChange}
                        cropShape="round"
                        showGrid={false}
                    />
                </div>
                <div className={styles.controls}>
                    <div className={styles.sliderContainer}>
                        <Minus size={20} onClick={() => setZoom(Math.max(1, zoom - 0.1))} style={{ cursor: 'pointer' }} />
                        <input
                            type="range"
                            value={zoom}
                            min={1}
                            max={3}
                            step={0.1}
                            aria-labelledby="Zoom"
                            onChange={(e) => setZoom(Number(e.target.value))}
                            className={styles.slider}
                        />
                        <Plus size={20} onClick={() => setZoom(Math.min(3, zoom + 0.1))} style={{ cursor: 'pointer' }} />
                    </div>
                    <div className={styles.buttons}>
                        <Button variant="secondary" onClick={onCancel} disabled={isLoading}>
                            Отмена
                        </Button>
                        <Button onClick={handleSave} disabled={isLoading}>
                            {isLoading ? 'Сохранение...' : 'Готово'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
