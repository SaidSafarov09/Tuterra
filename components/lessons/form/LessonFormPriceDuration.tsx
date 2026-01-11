import React from 'react'
import { Input } from '@/components/ui/Input'
import { TrialToggle } from '@/components/lessons/TrialToggle'
import { DurationSelector } from '@/components/lessons/DurationSelector'
import { ClockIcon } from '@/components/icons/Icons'
import { formatLessonEndTime } from '@/lib/lessonTimeUtils'
import styles from './LessonForm.module.scss'
import { useAuthStore } from '@/store/auth'
import { Checkbox } from '@/components/ui/Checkbox'

interface LessonFormPriceDurationProps {
    price: string
    duration: number
    date: Date
    isTrial: boolean
    activeTab: 'single' | 'recurring'
    seriesPrice?: string
    onPriceChange: (value: string) => void
    onDurationChange: (value: number) => void
    onTrialChange: (value: boolean) => void
    onSeriesPriceChange?: (value: string) => void
    disabled?: boolean
    isGroup?: boolean
    rememberPrice?: boolean
    onRememberPriceChange?: (value: boolean) => void
    savedPrice?: number | null
}

export function LessonFormPriceDuration({
    price,
    duration,
    date,
    isTrial,
    activeTab,
    seriesPrice,
    onPriceChange,
    onDurationChange,
    onTrialChange,
    onSeriesPriceChange,
    disabled,
    isGroup,
    rememberPrice = false,
    onRememberPriceChange,
    savedPrice
}: LessonFormPriceDurationProps) {
    const { user } = useAuthStore()
    const currency = user?.currency || '₽'
    return (
        <>
            <TrialToggle
                isTrial={isTrial}
                label={activeTab === 'recurring' ? "Первый урок пробный" : "Пробный урок"}
                subtitle="Если урок бесплатный — поставьте цену 0. Пробный урок может быть платным."
                onChange={onTrialChange}
                disabled={disabled}
            />

            <div className={styles.priceRow}>
                <Input
                    label={isGroup ? `Стоимость с ученика (${currency})` : `Стоимость (${currency})`}
                    type="number"
                    value={price}
                    onChange={(e) => onPriceChange(e.target.value)}
                    placeholder="0"
                    required
                    disabled={disabled}
                />

                <DurationSelector
                    value={duration}
                    onChange={onDurationChange}
                    disabled={disabled}
                />

                <div className={styles.endTimeContainer}>
                    <label className={styles.label}>Окончание</label>
                    <div className={styles.endTimeValue}>
                        <ClockIcon size={16} />
                        {date ? formatLessonEndTime(date, duration) : '—'}
                    </div>
                </div>
            </div>

            {(price === '0' || isTrial) && activeTab === 'recurring' && onSeriesPriceChange ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <Input
                        label={`Стоимость следующих занятий (${currency})`}
                        type="number"
                        value={seriesPrice || ''}
                        onChange={(e) => onSeriesPriceChange(e.target.value)}
                        placeholder={
                            price === '0'
                                ? "Оставьте пустым, если тоже бесплатно"
                                : "Оставьте пустым, если цена как у пробного"
                        }
                        disabled={disabled}
                    />

                    {seriesPrice && seriesPrice !== '' && parseInt(seriesPrice) !== savedPrice && (
                        <div className={styles.rememberPriceContainer}>
                            <Checkbox
                                label={savedPrice !== undefined && savedPrice !== null ? "Запомнить новую цену" : "Запомнить цену"}
                                checked={rememberPrice}
                                onChange={(e) => onRememberPriceChange?.(e.target.checked)}
                                disabled={disabled}
                            />
                        </div>
                    )}
                </div>
            ) : (!isTrial && (
                savedPrice === undefined ||
                savedPrice === null ||
                (price !== '' && parseInt(price) !== savedPrice)
            ) && (
                    <div className={styles.rememberPriceContainer}>
                        <Checkbox
                            label={savedPrice !== undefined && savedPrice !== null ? "Запомнить новую цену" : "Запомнить цену"}
                            checked={rememberPrice}
                            onChange={(e) => onRememberPriceChange?.(e.target.checked)}
                            disabled={disabled}
                        />
                    </div>
                ))}
        </>
    )
}
