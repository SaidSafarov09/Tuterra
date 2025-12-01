import React, { useEffect, useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import * as Avatar from '@radix-ui/react-avatar'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { StatItem } from '@/components/ui/StatItem'
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

interface UserProfileModalProps {
    isOpen: boolean
    onClose: () => void
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose }) => {
    const { data: session } = useSession()
    const [stats, setStats] = useState<DashboardStats | null>(null)

    useEffect(() => {
        if (isOpen) {
            statsApi.get().then(setStats).catch(console.error)
        }
    }, [isOpen])

    const avatarBgColor = session?.user?.name ? stringToColor(session.user.name) : 'var(--primary)'

    const memberSinceDate = stats?.createdAt ? new Date(stats.createdAt) : null

    const memberSinceText = memberSinceDate
        ? `${MONTHS_GENITIVE[memberSinceDate.getMonth()]} ${memberSinceDate.getFullYear()}`
        : ''

    const memberSince = stats?.createdAt
        ? `Репетитор с ${memberSinceText}`
        : 'Репетитор SkillTrack'

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Профиль преподавателя"
        >
            <div className={styles.container}>
                {/* Header Card */}
                <div className={styles.headerCard}>
                    <Avatar.Root className={styles.userAvatar} style={{ backgroundColor: avatarBgColor }}>
                        <Avatar.Image
                            className={styles.avatarImage}
                            src={session?.user?.image || undefined}
                            alt={session?.user?.name || 'User'}
                        />
                        <Avatar.Fallback
                            className={styles.avatarFallback}
                            style={{ backgroundColor: avatarBgColor, color: 'white' }}
                        >
                            {getInitials(session?.user?.name || '')}
                        </Avatar.Fallback>
                    </Avatar.Root>
                    <div className={styles.userInfo}>
                        <h3 className={styles.userName}>
                            {session?.user?.name || 'Загрузка...'}
                        </h3>
                        <p className={styles.userEmail}>
                            {session?.user?.email || ''}
                        </p>
                        <div className={styles.memberBadge}>
                            <span className={styles.activeDot}></span>
                            {memberSince}
                        </div>
                    </div>
                </div>

                <div className={styles.statsGrid}>
                    <StatItem
                        label={declension(stats?.studentsCount || 0, ['Ученик', 'Ученика', 'Учеников'])}
                        value={stats?.studentsCount || 0}
                        icon={StudentsIcon}
                        href="/students"
                        onClick={onClose}
                    />
                    <StatItem
                        label={declension(stats?.totalLessons || 0, ['Занятие', 'Занятия', 'Занятий'])}
                        value={stats?.totalLessons || 0}
                        icon={LessonsIcon}
                        href="/lessons"
                        onClick={onClose}
                    />
                    <StatItem
                        label="Доход за месяц"
                        value={`${stats?.monthlyIncome?.toLocaleString() || 0} ₽`}
                        icon={PaymentsIcon}
                        href="/income"
                        onClick={onClose}
                    />
                    <StatItem
                        label={declension(stats?.subjectsCount || 0, ['Предмет', 'Предмета', 'Предметов'])}
                        value={stats?.subjectsCount || 0}
                        icon={SubjectsIcon}
                        href="/subjects"
                        onClick={onClose}
                    />
                </div>

                <div className={styles.footer}>
                    <Link href="/settings" onClick={onClose}>
                        <Button variant="secondary" size="small">
                            <SettingsIcon size={16} style={{ marginRight: '8px' }} />
                            Настройки
                        </Button>
                    </Link>
                    <Button
                        variant="danger"
                        onClick={() => signOut({ callbackUrl: '/login' })}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        <LogoutIcon size={18} />
                        Выйти из аккаунта
                    </Button>
                </div>
            </div>
        </Modal>
    )
}
