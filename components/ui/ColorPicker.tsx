'use client'

import React, { useState } from 'react'
import { PaletteIcon } from 'lucide-react'
import styles from './ColorPicker.module.scss'

interface ColorPickerProps {
    value: string
    onChange: (color: string) => void
    presetColors?: string[]
}

export const ColorPicker: React.FC<ColorPickerProps> = ({
    value,
    onChange,
    presetColors = [
        '#4A6CF7', // Синий
        '#10B981', // Зеленый
        '#F59E0B', // Оранжевый
        '#EF4444', // Красный
        '#8B5CF6', // Фиолетовый
        '#EC4899', // Розовый
        '#14B8A6', // Бирюзовый
        '#F97316', // Оранжево-красный
    ],
}) => {
    const [customColor, setCustomColor] = useState(value)
    const [showCustom, setShowCustom] = useState(false)

    const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newColor = e.target.value
        setCustomColor(newColor)
        onChange(newColor)
    }

    return (
        <div className={styles.colorPicker}>
            <div className={styles.colorsRow}>
                <div className={styles.presetColors}>
                    {presetColors.map((color) => (
                        <button
                            key={color}
                            type="button"
                            className={`${styles.colorOption} ${value === color ? styles.selected : ''}`}
                            style={{ background: color }}
                            onClick={() => onChange(color)}
                            title={color}
                        />
                    ))}
                </div>

                <button
                    type="button"
                    className={styles.customButton}
                    onClick={() => setShowCustom(!showCustom)}
                    title="Выбрать свой цвет"
                >
                    <PaletteIcon size={18} />
                </button>
            </div>

            {showCustom && (
                <div className={styles.customInput}>
                    <input
                        type="color"
                        value={customColor}
                        onChange={handleCustomColorChange}
                        className={styles.colorInput}
                    />
                    <input
                        type="text"
                        value={customColor}
                        onChange={(e) => {
                            const val = e.target.value
                            setCustomColor(val)
                            if (/^#[0-9A-F]{6}$/i.test(val)) {
                                onChange(val)
                            }
                        }}
                        placeholder="#000000"
                        className={styles.hexInput}
                        maxLength={7}
                    />
                </div>
            )}
        </div>
    )
}
