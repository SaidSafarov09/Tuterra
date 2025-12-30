import React, { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/auth'
import Link from 'next/link'
import * as Avatar from '@radix-ui/react-avatar'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { StatItem } from '@/components/ui/StatItem'
import { Skeleton } from '@/components/ui/Skeleton'
import { statsApi } from '@/services/api'
import { DashboardStats } from '@/types'
import { declension, stringToColor, getInitials } from '@/lib/utils'
import { MONTHS_GENITIVE } from '@/constants/date'
import {
    StudentsIcon,
    LessonsIcon,
    SubjectsIcon,
    PaymentsIcon,
    SettingsIcon,
    LogoutIcon,
} from '@/components/icons/Icons'
import styles from './UserProfileModal.module.scss'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { calculateAge, getAgeString } from '@/lib/validation'

interface UserProfileModalProps {
    isOpen: boolean
    onClose: () => void
    onSidebarClose?: () => void
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose, onSidebarClose }) => {
    const isMobile = useMediaQuery('(max-width: 768px)')
    const { user, logout } = useAuthStore()
    const [stats, setStats] = useState<DashboardStats | null>(null)

    useEffect(() => {
        if (isOpen) {
            statsApi.get().then(setStats).catch(console.error)
        }
    }, [isOpen])

    const avatarBgColor = user?.firstName ? stringToColor(user.firstName) : user?.name ? stringToColor(user.name.split(' ')[0]) : 'var(--primary)'

    const memberSinceDate = stats?.createdAt ? new Date(stats.createdAt) : null

    const memberSinceText = memberSinceDate
        ? `${MONTHS_GENITIVE[memberSinceDate.getMonth()]} ${memberSinceDate.getFullYear()}`
        : ''

    const memberSince = stats?.createdAt
        ? `Репетитор с ${memberSinceText}`
        : <Skeleton width={120} height={16} />

    const handleNavigate = () => {
        onClose()
        onSidebarClose?.()
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={user?.role === 'student' ? "Мой профиль" : "Профиль преподавателя"}
        >
            <div className={styles.container}>
                <div className={styles.header}>
                    <div className={styles.headerCard}>
                        <Avatar.Root className={styles.userAvatar} style={{ backgroundColor: avatarBgColor }}>
                            <Avatar.Image
                                className={styles.avatarImage}
                                src={user?.avatar || undefined}
                                alt={user?.firstName || user?.lastName ? `${user?.firstName || ''} ${user?.lastName || ''}`.trim() : user?.name || 'User'}
                            />
                            <Avatar.Fallback
                                className={styles.avatarFallback}
                                style={{ backgroundColor: avatarBgColor, color: 'white' }}
                            >
                                {getInitials(user?.firstName || user?.lastName ? `${user?.firstName || ''} ${user?.lastName || ''}`.trim() : user?.name || '')}
                            </Avatar.Fallback>
                        </Avatar.Root>
                        <div className={styles.userInfo}>
                            <h3 className={styles.userName}>
                                {user?.firstName || user?.lastName ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : user?.name || <Skeleton width={150} height={28} />}
                                {user?.birthDate && (
                                    <span>
                                        , {(() => {
                                            const age = calculateAge(new Date(user.birthDate));
                                            return getAgeString(age);
                                        })()}
                                    </span>
                                )}
                            </h3>
                            <div className={styles.userEmail}>
                                {user?.phone || user?.email || <Skeleton width={100} height={16} />}
                            </div>
                        </div>
                    </div>
                    <div className={styles.memberBadge}>
                        <span className={styles.activeDot}></span>
                        {stats?.createdAt
                            ? `${user?.role === 'student' ? 'С нами' : 'Репетитор'} с ${memberSinceText}`
                            : <Skeleton width={120} height={16} />}
                    </div>
                </div>

                <div className={styles.statsGrid}>
                    {user?.role === 'student' ? (
                        <>
                            <StatItem
                                label={stats ? declension(stats.teachersCount || 0, ['Репетитор', 'Репетитора', 'Репетиторов']) : 'Репетиторы'}
                                value={stats ? stats.teachersCount || 0 : <Skeleton width={40} height={24} />}
                                icon={StudentsIcon}
                                href="/student/teachers"
                                onClick={handleNavigate}
                            />
                            <StatItem
                                label={stats ? declension(stats.totalLessonsCount || 0, ['Занятие', 'Занятия', 'Занятий']) : 'Занятия'}
                                value={stats ? stats.totalLessonsCount || 0 : <Skeleton width={40} height={24} />}
                                icon={LessonsIcon}
                                href="/student/lessons"
                                onClick={handleNavigate}
                            />
                            <StatItem
                                label="В этом месяце"
                                value={stats ? stats.monthLessonsCount || 0 : <Skeleton width={40} height={24} />}
                                icon={SubjectsIcon}
                                href="/student/lessons"
                                onClick={handleNavigate}
                            />
                        </>
                    ) : (
                        <>
                            <StatItem
                                label={stats ? declension(stats.studentsCount, ['Ученик', 'Ученика', 'Учеников']) : 'Ученики'}
                                value={stats ? stats.studentsCount : <Skeleton width={40} height={24} />}
                                icon={StudentsIcon}
                                href="/students"
                                onClick={handleNavigate}
                            />
                            <StatItem
                                label={stats ? declension(stats.totalLessons || 0, ['Занятие', 'Занятия', 'Занятий']) : 'Занятия'}
                                value={stats ? stats.totalLessons || 0 : <Skeleton width={40} height={24} />}
                                icon={LessonsIcon}
                                href="/lessons"
                                onClick={handleNavigate}
                            />
                            <StatItem
                                label="Этот месяц"
                                value={stats ? `${stats.monthlyIncome?.toLocaleString() || 0} ₽` : <Skeleton width={80} height={24} />}
                                icon={PaymentsIcon}
                                href="/income"
                                onClick={handleNavigate}
                            />
                            <StatItem
                                label={stats ? declension(stats.subjectsCount || 0, ['Предмет', 'Предмета', 'Предметов']) : 'Предметы'}
                                value={stats ? stats.subjectsCount || 0 : <Skeleton width={40} height={24} />}
                                icon={SubjectsIcon}
                                href="/subjects"
                                onClick={handleNavigate}
                            />
                        </>
                    )}
                </div>

                <div className={styles.footer}>
                    <Link href="/settings" onClick={handleNavigate}>
                        <Button variant="secondary">
                            <SettingsIcon size={16} style={{ marginRight: isMobile ? "0" : "8px" }} />
                            Настройки
                        </Button>
                    </Link>
                    <Button
                        variant="danger"
                        onClick={async () => {
                            await logout()
                            window.location.href = '/auth'
                        }}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        <LogoutIcon size={18} />
                        {isMobile ? 'Выйти' : 'Выйти из аккаунта'}
                    </Button>
                </div>
            </div>
        </Modal>
    )
}
