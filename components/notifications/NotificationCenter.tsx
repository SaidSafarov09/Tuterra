'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
    BellIcon,
    SettingsIcon,
    Trash2,
    X,
    Clock,
    DollarSign,
    AlertTriangle,
    Info,
    ChevronDown,
    ChevronUp,
    CheckCircle,
    Calendar,
    RefreshCw,
    PlusCircle,
    Sun,
    Moon,
    Sparkles,
    User,
    Send
} from 'lucide-react'
import styles from './NotificationCenter.module.scss'
import { useMediaQuery } from '@/hooks/useMediaQuery'

import { notificationsApi } from '@/services/api'

export interface Notification {
    id: string
    title: string
    message: string
    type: 'lesson_reminder' | 'unpaid_lesson' | 'status_change' | 'income' | 'debt' | 'missing_lessons' | 'onboarding' | 'lesson_deleted' | 'lesson_rescheduled' | 'lesson_created' | 'morning_briefing' | 'evening_summary' | 'system' | 'profile_setup' | 'telegram_invite'
    isRead: boolean
    createdAt: string
    link?: string
}

export const NotificationCenter: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false)
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [, setIsLoading] = useState(true)
    const isMobile = useMediaQuery('(max-width: 768px)')
    const dropdownRef = useRef<HTMLDivElement>(null)
    const router = useRouter()
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

    const unreadCount = notifications.filter(n => !n.isRead).length

    useEffect(() => {
        fetchNotifications()
    }, [])

    const fetchNotifications = async () => {
        try {
            const data = await notificationsApi.getAll()
            setNotifications(data)
        } catch (error) {
            console.error('Failed to fetch notifications:', error)
        } finally {
            setIsLoading(false)
        }
    }

    // Poll for notifications every 60 seconds
    useEffect(() => {
        // Initial smart check
        fetch('/api/cron/notifications').catch(e => console.error('Smart check failed', e))

        const interval = setInterval(() => {
            fetchNotifications()
        }, 60000)

        return () => clearInterval(interval)
    }, [])

    const markAllAsRead = async () => {
        try {
            await notificationsApi.markAllAsRead()
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
        } catch (error) {
            console.error('Failed to mark all as read:', error)
        }
    }

    const markAsRead = async (id: string, isRead: boolean) => {
        if (isRead) return
        try {
            await notificationsApi.markAsRead(id)
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
        } catch (error) {
            console.error('Failed to mark as read:', error)
        }
    }

    const deleteNotification = async (id: string) => {
        try {
            await notificationsApi.delete(id)
            setNotifications(prev => prev.filter(n => n.id !== id))
        } catch (error) {
            console.error('Failed to delete notification:', error)
        }
    }

    const toggleExpand = (id: string, e: React.MouseEvent) => {
        e.stopPropagation()
        setExpandedIds(prev => {
            const next = new Set(prev)
            if (next.has(id)) {
                next.delete(id)
            } else {
                next.add(id)
            }
            return next
        })
    }

    const goToSettings = () => {
        setIsOpen(false)
        router.push('/settings?tab=notifications')
    }

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                // If clicking trigger, don't close immediately (handled by trigger click)
                const target = event.target as HTMLElement
                if (target.closest(`.${styles.trigger}`)) return
                setIsOpen(false)
            }
        }
        if (isOpen && !isMobile) {
            document.addEventListener('mousedown', handleClickOutside)
        }
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [isOpen, isMobile])

    useEffect(() => {
        if (isOpen && isMobile) {
            document.body.style.overflow = 'hidden'
            document.documentElement.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = ''
            document.documentElement.style.overflow = ''
        }

        return () => {
            document.body.style.overflow = ''
            document.documentElement.style.overflow = ''
        }
    }, [isOpen, isMobile])

    const getIcon = (type: Notification['type']) => {
        switch (type) {
            case 'lesson_reminder': return <Clock size={20} />
            case 'unpaid_lesson': return <AlertTriangle size={20} />
            case 'income': return <DollarSign size={20} />
            case 'status_change': return <RefreshCw size={20} />
            case 'lesson_deleted': return <Trash2 size={20} />
            case 'lesson_rescheduled': return <RefreshCw size={20} />
            case 'lesson_created': return <PlusCircle size={20} />
            case 'debt': return <AlertTriangle size={20} />
            case 'morning_briefing': return <Sun size={20} />
            case 'evening_summary': return <Moon size={20} />
            case 'system': return <Sparkles size={20} />
            case 'profile_setup': return <User size={20} />
            case 'telegram_invite': return <Send size={20} />
            default: return <Info size={20} />
        }
    }

    const getIconClass = (type: Notification['type']) => {
        switch (type) {
            case 'lesson_reminder': return styles.typeIconReminder
            case 'unpaid_lesson': return styles.typeIconWarning
            case 'income': return styles.typeIconSuccess
            case 'morning_briefing': return styles.typeIconInfo
            case 'evening_summary': return styles.typeIconSuccess
            case 'lesson_deleted': return styles.typeIconError
            case 'lesson_rescheduled': return styles.typeIconInfo
            case 'lesson_created': return styles.typeIconSuccess
            case 'debt': return styles.typeIconError
            case 'system': return styles.typeIconSystem
            case 'profile_setup': return styles.typeIconProfile
            case 'telegram_invite': return styles.typeIconTelegram
            default: return styles.typeIconInfo
        }
    }

    const handleNotificationClick = (notification: Notification) => {
        markAsRead(notification.id, notification.isRead)
        if (notification.link) {
            setIsOpen(false)
            router.push(notification.link)
        }
    }

    const content = (
        <div className={styles.container} ref={dropdownRef}>
            <div className={styles.header}>
                <h3>Уведомления</h3>
                <div className={styles.headerActions}>
                    {unreadCount > 0 && (
                        <button onClick={markAllAsRead} className={styles.markAll}>
                            Прочитать все
                        </button>
                    )}
                    <button className={styles.settingsBtn} onClick={goToSettings}>
                        <SettingsIcon size={18} />
                    </button>
                    {isMobile && (
                        <button onClick={() => setIsOpen(false)} className={styles.closeBtn}>
                            <X size={20} />
                        </button>
                    )}
                </div>
            </div>

            <div className={styles.list}>
                {notifications.length > 0 ? (
                    notifications.map(notification => {
                        const isExpanded = expandedIds.has(notification.id)
                        return (
                            <div
                                key={notification.id}
                                className={`${styles.item} ${!notification.isRead ? styles.unread : ''}`}
                                onClick={() => handleNotificationClick(notification)}
                            >
                                <div className={`${styles.itemIcon} ${getIconClass(notification.type)}`}>
                                    {getIcon(notification.type)}
                                </div>
                                <div className={styles.itemContent}>
                                    <div className={styles.itemHeader}>
                                        <span className={styles.itemTitle}>{notification.title}</span>
                                        <span className={styles.itemTime}>
                                            {new Date(notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <div className={styles.messageWrapper}>
                                        <p className={`${styles.itemMessage} ${isExpanded ? styles.expanded : ''}`}>
                                            {isExpanded ? notification.message : notification.message.slice(0, 60) + (notification.message.length > 60 ? '...' : '')}
                                        </p>
                                        {notification.message.length > 60 && (
                                            <button
                                                className={styles.expandBtn}
                                                onClick={(e) => toggleExpand(notification.id, e)}
                                            >
                                                {isExpanded ? 'Свернуть' : 'Читать далее'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <button
                                    className={styles.deleteBtn}
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        deleteNotification(notification.id)
                                    }}
                                    aria-label="Удалить уведомление"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        )
                    })
                ) : (
                    <div className={styles.empty}>
                        <BellIcon size={48} />
                        <p>У вас пока нет уведомлений</p>
                    </div>
                )}
            </div>
        </div>
    )

    return (
        <div className={styles.wrapper}>
            <button
                className={`${styles.trigger} ${isOpen ? styles.active : ''}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                <BellIcon size={20} />
                {unreadCount > 0 && <span className={styles.badge}>{unreadCount}</span>}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        {isMobile ? (
                            <motion.div
                                className={styles.mobileModal}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 20 }}
                                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            >
                                {content}
                            </motion.div>
                        ) : (
                            <div className={styles.dropdown}>
                                {content}
                            </div>
                        )}
                    </>
                )}
            </AnimatePresence>
        </div>
    )
}
