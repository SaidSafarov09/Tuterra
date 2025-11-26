'use client'

import React, { useState, useRef, useEffect } from 'react'
import styles from './Dropdown.module.scss'
import { ChevronDownIcon, SearchIcon, PlusIcon } from '@/components/icons/Icons'

export interface DropdownOption {
    value: string
    label: string
    icon?: React.ReactNode
}

interface DropdownProps {
    label?: string
    placeholder?: string
    value?: string
    onChange: (value: string) => void
    options: DropdownOption[]
    searchable?: boolean
    creatable?: boolean
    onCreate?: (value: string) => void
    disabled?: boolean
    required?: boolean
    error?: string
    className?: string
}

export const Dropdown: React.FC<DropdownProps> = ({
    label,
    placeholder = 'Выберите опцию',
    value,
    onChange,
    options,
    searchable = false,
    creatable = false,
    onCreate,
    disabled = false,
    required = false,
    error,
    className = '',
}) => {
    const [isOpen, setIsOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const dropdownRef = useRef<HTMLDivElement>(null)

    const selectedOption = options.find((opt) => opt.value === value)

    const filteredOptions = searchQuery
        ? options.filter((opt) =>
            opt.label.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : options

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
                setSearchQuery('')
            }
        }

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside)
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [isOpen])

    const handleSelect = (optionValue: string) => {
        onChange(optionValue)
        setIsOpen(false)
        setSearchQuery('')
    }

    const handleCreate = () => {
        if (onCreate && searchQuery) {
            onCreate(searchQuery)
            setIsOpen(false)
            setSearchQuery('')
        }
    }

    const showCreateOption = creatable && searchQuery && !options.some(opt => opt.label.toLowerCase() === searchQuery.toLowerCase())

    return (
        <div className={`${styles.dropdown} ${className}`} ref={dropdownRef}>
            {label && (
                <label className={styles.label}>
                    {label}
                    {required && <span className={styles.required}>*</span>}
                </label>
            )}

            <button
                type="button"
                className={`${styles.trigger} ${isOpen ? styles.open : ''} ${error ? styles.error : ''
                    } ${disabled ? styles.disabled : ''}`}
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
            >
                <span className={selectedOption ? '' : styles.placeholder}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <span className={`${styles.icon} ${isOpen ? styles.open : ''}`}>
                    <ChevronDownIcon size={16} />
                </span>
            </button>

            {isOpen && (
                <div className={styles.menu}>
                    {searchable && (
                        <div className={styles.search}>
                            <input
                                type="text"
                                placeholder="Поиск..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                autoFocus
                            />
                        </div>
                    )}

                    <div className={styles.optionsList}>
                        {filteredOptions.map((option) => (
                            <div
                                key={option.value}
                                className={`${styles.option} ${option.value === value ? styles.selected : ''
                                    }`}
                                onClick={() => handleSelect(option.value)}
                            >
                                {option.icon && option.icon}
                                <span>{option.label}</span>
                            </div>
                        ))}

                        {showCreateOption && (
                            <div className={styles.createOption} onClick={handleCreate}>
                                <PlusIcon size={14} />
                                <span>Создать &quot;{searchQuery}&quot;</span>
                            </div>
                        )}

                        {filteredOptions.length === 0 && !showCreateOption && (
                            <div className={styles.emptyState}>
                                {searchQuery ? 'Ничего не найдено' : 'Нет опций'}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {error && <div className={styles.errorMessage}>{error}</div>}
        </div>
    )
}
