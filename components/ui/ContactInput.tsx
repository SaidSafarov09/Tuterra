import React from 'react'
import { PhoneIcon, TelegramIcon, WhatsAppIcon } from '@/components/icons/Icons'
import { Input } from '@/components/ui/Input'
import { ContactType, CONTACT_TYPES, getContactPlaceholder, formatContactInput } from '@/lib/contactUtils'
import styles from './ContactInput.module.scss'

interface ContactInputProps {
    value: string
    type: ContactType
    onChange: (value: string, type: ContactType) => void
    label: string
    error?: string
    placeholder?: string
    disabled?: boolean
}

export const ContactInput: React.FC<ContactInputProps> = ({
    value,
    type,
    onChange,
    label,
    error,
    placeholder,
    disabled
}) => {
    const handleTypeSelect = (newType: ContactType) => {
        onChange(value, newType)
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value
        const formattedValue = formatContactInput(type, newValue)
        onChange(formattedValue, type)
    }

    const getIcon = (contactType: ContactType) => {
        switch (contactType) {
            case 'phone': return <PhoneIcon size={16} />
            case 'telegram': return <TelegramIcon size={16} />
            case 'whatsapp': return <WhatsAppIcon size={16} />
        }
    }

    return (
        <div className={styles.container}>
            <label className={styles.label}>{label}</label>

            <div className={styles.typeSelectorContainer}>


                <div className={styles.inputWrapper}>
                    <Input
                        value={value}
                        onChange={handleChange}
                        placeholder={placeholder || getContactPlaceholder(type)}
                        error={error}
                        disabled={disabled}
                        type={type === 'phone' ? 'tel' : 'text'}
                    />
                </div>
                <div className={styles.typeSelectorRow}>
                    {CONTACT_TYPES.map((item) => (
                        <button
                            key={item.type}
                            type="button"
                            className={`${styles.typeOption} ${type === item.type ? styles.selected : ''}`}
                            onClick={() => handleTypeSelect(item.type)}
                            disabled={disabled}
                            title={item.label}
                        >
                            {getIcon(item.type)}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    )
}
