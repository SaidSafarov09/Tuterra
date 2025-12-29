'use client'

import React from 'react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import {
    UsersGroupIcon,
    BookIcon,
    AlertIcon,
    MoneyIcon,
    CelebrationIcon,
    CalendarIcon,
    StudentsIcon,
} from '@/components/icons/Icons'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatCard } from '@/components/ui/StatCard'
import { Section } from '@/components/ui/Section'
import { LessonCard } from '@/components/ui/LessonCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { StatCardSkeleton, LessonCardSkeleton } from '@/components/skeletons'
import { statsApi } from '@/services/api'
import { GENERAL_MESSAGES } from '@/constants/messages'
import { toast } from 'sonner'
import { DashboardStats } from '@/types'
import { useRouter } from 'next/navigation'
import styles from './page.module.scss'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { MONTHS_GENITIVE } from '@/constants/messages'
import { useAuthStore } from '@/store/auth'
import { CircleCheck } from 'lucide-react'
import { StudentConnectionModal } from '@/components/students/StudentConnectionModal'
import { Modal } from '@/components/ui/Modal'

export default function DashboardPage() {
    const router = useRouter()
    const { user } = useAuthStore()
    const [stats, setStats] = React.useState<DashboardStats | null>(null)
    const [isLoading, setIsLoading] = React.useState(true)
    const isMobile = useMediaQuery('(max-width: 768px)')
    const currentMonth = Date.now()
    const isStudent = user?.role === 'student'
    const [isConnectionModalOpen, setIsConnectionModalOpen] = React.useState(false)
    const [isRequestsModalOpen, setIsRequestsModalOpen] = React.useState(false)

    const handleRequestAction = async (requestId: string, status: 'approved' | 'rejected') => {
        try {
            const response = await fetch(`/api/student-requests/${requestId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            })
            if (!response.ok) throw new Error()
            toast.success(status === 'approved' ? 'Заявка одобрена' : 'Заявка отклонена')
            // Refresh stats
            const endpoint = isStudent ? '/api/student/stats' : '/api/stats'
            const res = await fetch(endpoint)
            const data = await res.json()
            if (data.success) setStats(data.stats)
        } catch (error) {
            console.error('Failed to fetch stats:', error)
        } finally {
            setIsLoading(false)
        }
    }

    React.useEffect(() => {
        const fetchStats = async () => {
            try {
                const endpoint = isStudent ? '/api/student/stats' : '/api/stats'
                const response = await fetch(endpoint)
                const data = await response.json()
                if (data.success) {
                    setStats(data.stats)
                    if (isStudent && data.stats.teachersCount === 0) {
                        setIsConnectionModalOpen(true)
                    }
                }
            } catch (error) {
                toast.error('Не удалось загрузить статистику')
            } finally {
                setIsLoading(false)
            }
        }

        fetchStats()
    }, [isStudent])

    return (
        <div>
            <PageHeader
                title="Главная"
                subtitle={isStudent ? "Ваш учебный процесс" : "Обзор вашей активности"}
            />

            <div className={styles.statsContainer}>
                <div className={styles.statsGrid} data-onboarding="dashboard-stats">
                    {isLoading ? (
                        <>
                            <StatCardSkeleton />
                            <StatCardSkeleton />
                            {!isStudent && <StatCardSkeleton />}
                            {!isStudent && <StatCardSkeleton />}
                        </>
                    ) : (
                        <>
                            {isStudent ? (
                                <>
                                    <StatCard
                                        icon={<UsersGroupIcon size={32} color="#3B82F6" />}
                                        label="Репетиторы"
                                        value={stats?.teachersCount || 0}
                                        href="/student/teachers"
                                    />
                                    <StatCard
                                        icon={<CalendarIcon size={32} color="#3B5BD9" />}
                                        label="Мои занятия"
                                        value={stats?.totalLessonsCount || 0}
                                        href="/student/lessons"
                                    />
                                </>
                            ) : (
                                <>
                                    <StatCard
                                        icon={<StudentsIcon size={32} color="#3B82F6" />}
                                        label="Ученики"
                                        value={stats?.studentsCount || 0}
                                        href="/students"
                                    />
                                    <StatCard
                                        icon={<UsersGroupIcon size={32} color="#F59E0B" />}
                                        label="Группы"
                                        value={stats?.groupsCount || 0}
                                        href="/groups"
                                    />
                                </>
                            )}

                            <StatCard
                                icon={<CalendarIcon size={32} color={isStudent ? "#F59E0B" : "#3B5BD9"} />}
                                label={<>Занятий в{isMobile ? <br /> : ''} {MONTHS_GENITIVE[format(currentMonth, 'LLLL', { locale: ru }).toLowerCase()]}</>}
                                value={stats?.monthLessonsCount || 0}
                                href={isStudent ? "/student/lessons" : `/lessons?month=${format(currentMonth, 'yyyy-MM')}`}
                            />

                            {!isStudent && (
                                <StatCard
                                    icon={<MoneyIcon size={32} color="#14B8A6" />}
                                    label={<>Доход{isMobile ? <br /> : ''} за месяц</>}
                                    value={`${stats?.monthlyIncome || 0} ₽`}
                                    href="/income"
                                />
                            )}
                        </>
                    )}
                </div>

                {!isStudent && stats?.pendingRequests && stats.pendingRequests.length > 0 && (
                    <div style={{ marginBottom: '32px' }}>
                        <Section
                            title="Заявки от учеников"
                            viewAllText={stats.pendingRequests.length > 3 ? "Все заявки →" : undefined}
                            onViewAllClick={() => setIsRequestsModalOpen(true)}
                        >
                            <div className={styles.requestsList}>
                                {stats.pendingRequests.slice(0, 3).map((req: any) => (
                                    <div key={req.id} className={styles.requestItem}>
                                        <div className={styles.requestMain}>
                                            <div className={`${styles.requestIcon} ${req.type === 'cancel' ? styles.iconCancel : styles.iconReschedule}`}>
                                                {req.type === 'cancel' ? <AlertIcon size={20} /> : <CalendarIcon size={20} />}
                                            </div>
                                            <div className={styles.requestDetails}>
                                                <div className={styles.requestTitle}>
                                                    <strong>{req.user.firstName || req.user.name}</strong> • {req.type === 'cancel' ? 'Отмена занятия' : 'Перенос занятия'}
                                                </div>
                                                <div className={styles.requestSubtitle}>
                                                    <span>{req.lesson.subject?.name || 'Без предмета'}</span>
                                                    <span className={styles.requestDateBadge}>
                                                        {format(new Date(req.lesson.date), 'd MMM, HH:mm', { locale: ru })}
                                                    </span>
                                                    {req.newDate && (
                                                        <>
                                                            <span>→</span>
                                                            <span className={styles.requestDateBadge} style={{ background: 'rgba(59, 91, 217, 0.1)', color: '#3B5BD9' }}>
                                                                {format(new Date(req.newDate), 'd MMM, HH:mm', { locale: ru })}
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className={styles.requestActionsRow}>
                                            <button
                                                className={`${styles.actionBtn} ${styles.rejectGhost}`}
                                                onClick={() => handleRequestAction(req.id, 'rejected')}
                                            >
                                                Отклонить
                                            </button>
                                            <button
                                                className={`${styles.actionBtn} ${styles.approveGhost}`}
                                                onClick={() => handleRequestAction(req.id, 'approved')}
                                            >
                                                Подтвердить
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Section>
                    </div>
                )}

                <div className={styles.sectionsGrid}>
                    <Section title="Ближайшие занятия" viewAllHref="/lessons" viewAllText="Все занятия →">
                        {isLoading ? (
                            <div className={styles.lessonsList}>
                                <LessonCardSkeleton variant="compact" />
                                <LessonCardSkeleton variant="compact" />
                                <LessonCardSkeleton variant="compact" />
                            </div>
                        ) : stats?.upcomingLessons && stats.upcomingLessons.length > 0 ? (
                            <div className={styles.lessonsList}>
                                {stats.upcomingLessons.map((lesson) => (
                                    <LessonCard key={lesson.id} lesson={lesson} variant="compact" isStudentView={isStudent} />
                                ))}
                            </div>
                        ) : (
                            <EmptyState title="Нет ближайших занятий" description={undefined} icon={<CalendarIcon size={48} color="var(--primary)" />} />
                        )}
                    </Section>

                    <Section
                        title={isStudent ? "Ожидают оплаты" : "Неоплаченные занятия"}
                        viewAllHref="/lessons?tab=unpaid"
                        viewAllText="Все неоплаченные →"
                    >
                        {isLoading ? (
                            <div className={styles.lessonsList}>
                                <LessonCardSkeleton variant="compact" />
                                <LessonCardSkeleton variant="compact" />
                                <LessonCardSkeleton variant="compact" />
                            </div>
                        ) : stats?.unpaidLessons && stats.unpaidLessons.length > 0 ? (
                            <div className={styles.lessonsList}>
                                {stats.unpaidLessons.slice(0, 5).map((lesson) => (
                                    <LessonCard key={lesson.id} lesson={lesson} variant="compact" isStudentView={isStudent} />
                                ))}
                            </div>
                        ) : (
                            <EmptyState
                                icon={<CircleCheck size={48} color="var(--success)" />}
                                title="Все занятия оплачены!" description={undefined} />
                        )}
                    </Section>
                </div>
            </div>

            <StudentConnectionModal
                isOpen={isConnectionModalOpen}
                onClose={() => setIsConnectionModalOpen(false)}
                onSuccess={() => {
                    // Refetch stats or refresh page
                    window.location.reload()
                }}
            />

            <Modal
                isOpen={isRequestsModalOpen}
                onClose={() => setIsRequestsModalOpen(false)}
                title="Все заявки"
                maxWidth="600px"
            >
                <div className={styles.requestsList} style={{ marginTop: 0 }}>
                    {stats?.pendingRequests?.map((req: any) => (
                        <div key={req.id} className={styles.requestItem}>
                            <div className={styles.requestMain}>
                                <div className={`${styles.requestIcon} ${req.type === 'cancel' ? styles.iconCancel : styles.iconReschedule}`}>
                                    {req.type === 'cancel' ? <AlertIcon size={20} /> : <CalendarIcon size={20} />}
                                </div>
                                <div className={styles.requestDetails}>
                                    <div className={styles.requestTitle}>
                                        <strong>{req.user.firstName || req.user.name}</strong> • {req.type === 'cancel' ? 'Отмена занятия' : 'Перенос занятия'}
                                    </div>
                                    <div className={styles.requestSubtitle}>
                                        <span>{req.lesson.subject?.name || 'Без предмета'}</span>
                                        <span className={styles.requestDateBadge}>
                                            {format(new Date(req.lesson.date), 'd MMM, HH:mm', { locale: ru })}
                                        </span>
                                        {req.newDate && (
                                            <>
                                                <span>→</span>
                                                <span className={styles.requestDateBadge} style={{ background: 'rgba(59, 91, 217, 0.1)', color: '#3B5BD9' }}>
                                                    {format(new Date(req.newDate), 'd MMM, HH:mm', { locale: ru })}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className={styles.requestActionsRow}>
                                <button
                                    className={`${styles.actionBtn} ${styles.rejectGhost}`}
                                    onClick={() => handleRequestAction(req.id, 'rejected')}
                                >
                                    Отклонить
                                </button>
                                <button
                                    className={`${styles.actionBtn} ${styles.approveGhost}`}
                                    onClick={() => handleRequestAction(req.id, 'approved')}
                                >
                                    Подтвердить
                                </button>
                            </div>
                        </div>
                    ))}
                    {(!stats?.pendingRequests || stats.pendingRequests.length === 0) && (
                        <p className={styles.loading}>Нет активных заявок</p>
                    )}
                </div>
            </Modal>
        </div>
    )
}