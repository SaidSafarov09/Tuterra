'use client'

import React, { useState } from 'react'
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
        '#4A6CF7', '#FF6B6B', '#4ECDC4', '#FFD93D', '#A8E6CF', '#FF8B94',
        '#7B68EE', '#FF69B4', '#00CED1', '#FFA500', '#9370DB', '#20B2AA',
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

            <div className={styles.customSection}>
                <button
                    type="button"
                    className={styles.customToggle}
                    onClick={() => setShowCustom(!showCustom)}
                >
                    {showCustom ? '− Скрыть' : '+ Свой цвет'}
                </button>

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
        </div>
    )
}
