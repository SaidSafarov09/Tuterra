'use client'

import React, { useState, useRef, useEffect } from 'react'
import styles from './Dropdown.module.scss'
import { ChevronDownIcon, SearchIcon, PlusIcon } from '@/components/icons/Icons'

export interface DropdownOption {
    value: string
    label: string
    icon?: React.ReactNode
}

export interface DropdownGroup {
    label: string
    options: DropdownOption[]
}

interface DropdownProps {
    label?: string
    placeholder?: string
    value?: string
    onChange: (value: string) => void
    options: (DropdownOption | DropdownGroup)[]
    searchable?: boolean
    creatable?: boolean
    onCreate?: (value: string) => void
    menuPosition?: 'absolute' | 'relative'
    disabled?: boolean
    required?: boolean
    error?: string
    onOpen?: () => void
    className?: string
    placeholderSearch?: string
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
    menuPosition = 'absolute',
    disabled = false,
    required = false,
    error,
    onOpen,
    className = '',
    placeholderSearch = "Найти/Создать"
}) => {
    const [isOpen, setIsOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [isMobile, setIsMobile] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.matchMedia('(max-width: 768px)').matches)
        }
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    const flattenOptions = (opts: (DropdownOption | DropdownGroup)[]): DropdownOption[] => {
        return opts.flatMap(opt => {
            if ('options' in opt) {
                return opt.options
            }
            return opt
        })
    }

    const allOptions = flattenOptions(options)
    const selectedOption = allOptions.find((opt) => opt.value === value)

    const filterOptions = (opts: (DropdownOption | DropdownGroup)[]): (DropdownOption | DropdownGroup)[] => {
        if (!searchQuery) return opts

        return opts.map(opt => {
            if ('options' in opt) {
                const filteredGroupOptions = opt.options.filter(o => o.label.toLowerCase().includes(searchQuery.toLowerCase()))
                if (filteredGroupOptions.length > 0) {
                    return { ...opt, options: filteredGroupOptions }
                }
                return null
            } else {
                return opt.label.toLowerCase().includes(searchQuery.toLowerCase()) ? opt : null
            }
        }).filter(Boolean) as (DropdownOption | DropdownGroup)[]
    }

    const filteredOptions = filterOptions(options)

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

    const toggle = () => {
        if (!disabled) {
            const newState = !isOpen
            setIsOpen(newState)
            if (newState && onOpen) {
                onOpen()
            }
        }
    }

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

    const showCreateOption = creatable && searchQuery && !allOptions.some(opt => opt.label.toLowerCase() === searchQuery.toLowerCase())

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
                onClick={toggle}
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
                <div className={`${styles.menu} ${menuPosition === 'relative' ? styles.menuRelative : ''}`}>
                    {searchable && (
                        <div className={styles.search}>
                            <input
                                type="text"
                                placeholder={placeholderSearch}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                autoFocus={!isMobile}
                            />
                        </div>
                    )}

                    <div className={styles.optionsList}>
                        {filteredOptions.map((option, index) => {
                            if ('options' in option) {
                                return (
                                    <div key={index} className={styles.group}>
                                        <div className={styles.groupLabel}>{option.label}</div>
                                        {option.options.map(opt => (
                                            <div
                                                key={opt.value}
                                                className={`${styles.option} ${opt.value === value ? styles.selected : ''}`}
                                                onClick={() => handleSelect(opt.value)}
                                            >
                                                {opt.icon && opt.icon}
                                                <span>{opt.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                )
                            } else {
                                return (
                                    <div
                                        key={option.value}
                                        className={`${styles.option} ${option.value === value ? styles.selected : ''}`}
                                        onClick={() => handleSelect(option.value)}
                                    >
                                        {option.icon && option.icon}
                                        <span>{option.label}</span>
                                    </div>
                                )
                            }
                        })}

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
