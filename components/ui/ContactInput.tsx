import React, { useState, useRef, useEffect } from 'react'
import { PhoneIcon, TelegramIcon, WhatsAppIcon, ChevronDownIcon } from '@/components/icons/Icons'
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
    const [isOpen, setIsOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [])

    const handleTypeSelect = (newType: ContactType) => {
        onChange(value, newType)
        setIsOpen(false)
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value
        // Auto-format based on type
        const formattedValue = formatContactInput(type, newValue)
        onChange(formattedValue, type)
    }

    const getIcon = (contactType: ContactType) => {
        switch (contactType) {
            case 'phone': return <PhoneIcon size={18} />
            case 'telegram': return <TelegramIcon size={18} />
            case 'whatsapp': return <WhatsAppIcon size={18} />
        }
    }

    return (
        <div className={styles.container}>
            <label className={styles.label}>{label}</label>
            <div className={styles.inputGroup}>
                <div className={styles.typeSelector} ref={dropdownRef}>
                    <button
                        type="button"
                        className={`${styles.typeButton} ${isOpen ? styles.active : ''}`}
                        onClick={() => !disabled && setIsOpen(!isOpen)}
                        disabled={disabled}
                    >
                        {getIcon(type)}
                    </button>

                    {isOpen && (
                        <div className={styles.dropdown}>
                            {CONTACT_TYPES.map((item) => (
                                <div
                                    key={item.type}
                                    className={`${styles.dropdownItem} ${type === item.type ? styles.selected : ''}`}
                                    onClick={() => handleTypeSelect(item.type)}
                                >
                                    {getIcon(item.type)}
                                    <span>{item.label}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

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
            </div>
        </div>
    )
}
