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
    ChevronUp
} from 'lucide-react'
import styles from './NotificationCenter.module.scss'
import { useMediaQuery } from '@/hooks/useMediaQuery'

import { notificationsApi } from '@/services/api'

export interface Notification {
    id: string
    title: string
    message: string
    type: 'lesson_reminder' | 'unpaid_lesson' | 'status_change' | 'income' | 'debt' | 'missing_lessons' | 'onboarding'
    isRead: boolean
    createdAt: string
    link?: string
}

export const NotificationCenter: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false)
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [isLoading, setIsLoading] = useState(true)
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
        } else {
            document.body.style.overflow = 'auto'
        }
    }, [isOpen, isMobile])

    const getTypeIcon = (type: Notification['type']) => {
        switch (type) {
            case 'lesson_reminder': return <Clock size={16} className={styles.typeIconReminder} />
            case 'unpaid_lesson': return <AlertTriangle size={16} className={styles.typeIconWarning} />
            case 'income': return <DollarSign size={16} className={styles.typeIconSuccess} />
            case 'status_change': return <Info size={16} className={styles.typeIconInfo} />
            case 'debt': return <AlertTriangle size={16} className={styles.typeIconError} />
            default: return <Info size={16} className={styles.typeIconInfo} />
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
                                onClick={() => markAsRead(notification.id, notification.isRead)}
                            >
                                <div className={styles.itemIcon}>
                                    {getTypeIcon(notification.type)}
                                </div>
                                <div className={styles.itemContent}>
                                    <div className={styles.itemHeader}>
                                        <span className={styles.itemTitle}>{notification.title}</span>
                                        <span className={styles.itemTime}>
                                            {new Date(notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <div className={`${styles.messageWrapper} ${isExpanded ? styles.expanded : ''}`}>
                                        <p className={styles.itemMessage}>{notification.message}</p>
                                        {notification.message.length > 50 && (
                                            <button
                                                className={styles.expandBtn}
                                                onClick={(e) => toggleExpand(notification.id, e)}
                                            >
                                                {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
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
                                >
                                    <Trash2 size={14} />
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
                className={`${styles.trigger} ${unreadCount > 0 ? styles.hasUnread : ''}`}
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
                                initial={{ y: '100%' }}
                                animate={{ y: 0 }}
                                exit={{ y: '100%' }}
                                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            >
                                {content}
                            </motion.div>
                        ) : (
                            <motion.div
                                className={styles.dropdown}
                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                transition={{ duration: 0.2 }}
                            >
                                {content}
                            </motion.div>
                        )}
                    </>
                )}
            </AnimatePresence>
        </div>
    )
}
