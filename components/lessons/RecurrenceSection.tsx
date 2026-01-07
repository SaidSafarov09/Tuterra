'use client'

import React from 'react'
import { Checkbox } from '@/components/ui/Checkbox'
import { Dropdown } from '@/components/ui/Dropdown'
import { Input } from '@/components/ui/Input'
import { DateTimePicker } from '@/components/ui/DateTimePicker'
import { WeekdayPicker } from '@/components/ui/WeekdayPicker'
import { RepeatIcon } from 'lucide-react'
import styles from './RecurrenceSection.module.scss'
import type { RecurrenceRule } from '@/types/recurring'
import { RECURRENCE_TYPE_LABELS, RECURRENCE_END_TYPE_LABELS } from '@/types/recurring'

interface RecurrenceSectionProps {
    value: RecurrenceRule
    onChange: (value: RecurrenceRule) => void
    disabled?: boolean
    startDate?: Date
}

export const RecurrenceSection: React.FC<RecurrenceSectionProps> = ({
    value,
    onChange,
    disabled = false,
    startDate
}) => {
    const updateRule = (updates: Partial<RecurrenceRule>) => {
        onChange({ ...value, ...updates })
    }

    const recurrenceTypeOptions = [
        { value: 'weekly', label: RECURRENCE_TYPE_LABELS.weekly },
        { value: 'daily', label: RECURRENCE_TYPE_LABELS.daily },
        { value: 'every_x_weeks', label: RECURRENCE_TYPE_LABELS['every_x_weeks'] },
    ]

    const getEndOfSchoolYearLabel = () => {
        const referenceDate = startDate || new Date()
        let year = referenceDate.getFullYear()
        if (referenceDate.getMonth() >= 5) { // Июнь и позже
            year += 1
        }
        return `${RECURRENCE_END_TYPE_LABELS.never} (до конца мая ${year})`
    }

    const endTypeOptions = [
        { value: 'never', label: getEndOfSchoolYearLabel() },
        { value: 'until_date', label: RECURRENCE_END_TYPE_LABELS.until_date },
        { value: 'count', label: RECURRENCE_END_TYPE_LABELS.count },
    ]

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <RepeatIcon size={18} />
                <span>Повтор</span>
            </div>

            <Checkbox
                checked={value.enabled}
                onChange={(e) => updateRule({ enabled: e.target.checked })}
                label="Повторять урок"
                disabled={disabled}
            />

            {value.enabled && (
                <div className={styles.fields}>
                    <Dropdown
                        label="Тип повторения"
                        value={value.type}
                        onChange={(type) => updateRule({ type: type as any })}
                        options={recurrenceTypeOptions}
                        disabled={disabled}
                        required
                    />

                    {value.type === 'every_x_weeks' && (
                        <Input
                            label="Интервал (недель)"
                            type="number"
                            value={value.interval?.toString() || ''}
                            onChange={(e) => updateRule({ interval: e.target.value === '' ? '' as any : parseInt(e.target.value) })}
                            min={1}
                            disabled={disabled}
                            required
                        />
                    )}

                    {(value.type === 'weekly' || value.type === 'every_x_weeks') && (
                        <div className={styles.field}>
                            <label className={styles.label}>Дни недели</label>
                            <WeekdayPicker
                                value={typeof value.daysOfWeek === 'string'
                                    ? JSON.parse(value.daysOfWeek || '[]')
                                    : value.daysOfWeek}
                                onChange={(days) => updateRule({ daysOfWeek: days })}
                                disabled={disabled}
                            />
                        </div>
                    )}

                    <div className={styles.field}>
                        <label className={styles.label}>Длительность повторения</label>
                        <div className={styles.radioGroup}>
                            {endTypeOptions.map((option) => (
                                <label key={option.value} className={styles.radio}>
                                    <input
                                        type="radio"
                                        name="endType"
                                        value={option.value}
                                        checked={value.endType === option.value}
                                        onChange={(e) => updateRule({ endType: e.target.value as any })}
                                        disabled={disabled}
                                    />
                                    <span>{option.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {value.endType === 'until_date' && (
                        <DateTimePicker
                            label="До даты"
                            value={value.endDate ? new Date(value.endDate) : undefined}
                            onChange={(date) => updateRule({ endDate: date })}
                            showTime={false}
                            disabled={disabled}
                            required
                        />
                    )}

                    {value.endType === 'count' && (
                        <Input
                            label="Количество повторений"
                            type="number"
                            value={value.occurrencesCount?.toString() || ''}
                            onChange={(e) => updateRule({ occurrencesCount: parseInt(e.target.value) || undefined })}
                            min={1}
                            disabled={disabled}
                            required
                            placeholder="10"
                        />
                    )}
                </div>
            )}
        </div>
    )
}
