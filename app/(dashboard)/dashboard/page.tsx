'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { UpgradeToProModal } from '@/components/pro/UpgradeToProModal'
import {
    UsersGroupIcon,
    MoneyIcon,
    CalendarIcon,
    StudentsIcon,
    CheckIcon,
    CircleXIcon,
    BanIcon,
    SubjectsIcon
} from '@/components/icons/Icons'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatCard } from '@/components/ui/StatCard'
import { Section } from '@/components/ui/Section'
import { LessonCard } from '@/components/ui/LessonCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { StatCardSkeleton, LessonCardSkeleton } from '@/components/skeletons'
import { toast } from 'sonner'
import { DashboardStats } from '@/types'
import styles from './page.module.scss'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { MONTHS_GENITIVE } from '@/constants/messages'
import { useAuthStore } from '@/store/auth'
import { CircleCheck } from 'lucide-react'
import { StudentConnectionModal } from '@/components/students/StudentConnectionModal'
import { Modal } from '@/components/ui/Modal'
import { PaymentSuccessModal } from '@/components/pro/PaymentSuccessModal'
import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense } from 'react'
import { PromotionalBanner } from '@/components/dashboard/PromotionalBanner'
import { settingsApi } from '@/services/api'
import { AnimatePresence } from 'framer-motion'
import { CareerProgress } from '@/components/dashboard/CareerProgress'
import { Insights } from '@/components/dashboard/Insights'

import { useCheckLimit } from '@/hooks/useCheckLimit'
import { FREE_LIMITS } from '@/lib/limits'
import { Student, Group } from '@/types'

function DashboardContent() {
    const { user, setUser } = useAuthStore()
    const { checkLimit, UpgradeModal, isPro } = useCheckLimit()
    const searchParams = useSearchParams()
    const [stats, setStats] = React.useState<DashboardStats | null>(null)
    const [isLoading, setIsLoading] = React.useState(true)
    const isMobile = useMediaQuery('(max-width: 768px)')
    const currentMonth = Date.now()

    const [lockedStudentIds, setLockedStudentIds] = React.useState<string[]>([])
    const [lockedGroupIds, setLockedGroupIds] = React.useState<string[]>([])

    // 1. Замораживаем роль пока ui не прыгал
    const [initialRole] = React.useState(user?.role)
    const currentRole = user?.role || initialRole
    const isStudent = currentRole === 'student'

    React.useEffect(() => {
        if (!user || isStudent || isPro) return

        const fetchData = async () => {
            try {
                const [studentsRes, groupsRes] = await Promise.all([
                    fetch('/api/students'),
                    fetch('/api/groups')
                ])
                const studentsData = await studentsRes.json()
                const groupsData = await groupsRes.json()

                if (Array.isArray(studentsData)) {
                    const lockedS = studentsData.filter((s: any) => s.isLocked).map((s: any) => s.id)
                    setLockedStudentIds(lockedS)
                }
                if (Array.isArray(groupsData)) {
                    const lockedG = groupsData.filter((g: any) => g.isLocked).map((g: any) => g.id)
                    setLockedGroupIds(lockedG)
                }
            } catch (e) {
                console.error("Failed to fetch limits data", e)
            }
        }
        fetchData()
    }, [user, isStudent, isPro])

    const checkLessonLock = (lesson: any): boolean => {
        if (isStudent) return false
        let locked = false
        if (lesson.student?.id && lockedStudentIds.includes(lesson.student.id)) locked = true
        if (lesson.group?.id && lockedGroupIds.includes(lesson.group.id)) locked = true

        if (locked && user?.proExpiresAt) {
            if (new Date(lesson.date) <= new Date(user.proExpiresAt)) {
                locked = false
            }
        }
        return locked
    }


    const [isConnectionModalOpen, setIsConnectionModalOpen] = React.useState(false)
    const [isRequestsModalOpen, setIsRequestsModalOpen] = React.useState(false)
    const [isPaymentSuccessModalOpen, setIsPaymentSuccessModalOpen] = React.useState(false)
    const [isUpgradeModalOpen, setIsUpgradeModalOpen] = React.useState(false)
    const [selectedPlan, setSelectedPlan] = React.useState<'month' | 'year'>('year')
    const [upgradeLimitType, setUpgradeLimitType] = React.useState<any>('general')
    const [isTelegramBannerVisible, setIsTelegramBannerVisible] = useState(false)
    const [isReferralBannerVisible, setIsReferralBannerVisible] = useState(false)
    const router = useRouter()

    useEffect(() => {
        // Expose global function to open upgrade modal from nested components
        (window as any).dispatchUpgradeModal = (limitType: any = 'income') => {
            setUpgradeLimitType(limitType)
            setIsUpgradeModalOpen(true)
        }

        return () => {
            delete (window as any).dispatchUpgradeModal
        }
    }, [])

    useEffect(() => {
        // Если пользователя нет (логаут), мгновенно всё скрываем и не считаем баннеры
        if (!user || user.role === 'student') {
            setIsTelegramBannerVisible(false)
            setIsReferralBannerVisible(false)
            return
        }

        const telegramDismissedUntil = localStorage.getItem('telegram_banner_dismissed_until')
        const referralDismissedUntil = localStorage.getItem('referral_banner_dismissed_until')
        const now = Date.now()

        if (!user.telegramId && (!telegramDismissedUntil || now > parseInt(telegramDismissedUntil))) {
            setIsTelegramBannerVisible(true)
            setIsReferralBannerVisible(false)
        } else if (user.telegramId && (!referralDismissedUntil || now > parseInt(referralDismissedUntil))) {
            setIsReferralBannerVisible(true)
            setIsTelegramBannerVisible(false)
        } else {
            setIsTelegramBannerVisible(false)
            setIsReferralBannerVisible(false)
        }
    }, [user?.telegramId, user?.role, !!user])

    const handleConnectTelegram = async () => {
        try {
            const res = await settingsApi.generateTelegramAuthCode()
            if (res.code) {
                window.open(`https://t.me/TuterraBot?start=${res.code}`, '_blank')
            } else {
                toast.error('Не удалось получить код привязки')
            }
        } catch (e) {
            toast.error('Ошибка при подключении Telegram')
        }
    }

    const dismissTelegramBanner = () => {
        setIsTelegramBannerVisible(false)
        const until = Date.now() + (3 * 24 * 60 * 60 * 1000)
        localStorage.setItem('telegram_banner_dismissed_until', until.toString())
    }

    const dismissReferralBanner = () => {
        setIsReferralBannerVisible(false)
        const until = Date.now() + (7 * 24 * 60 * 60 * 1000)
        localStorage.setItem('referral_banner_dismissed_until', until.toString())
    }

    const handleReferralAction = () => {
        router.push('/settings?tab=referral')
    }

    const handleRequestAction = async (requestId: string, status: 'approved' | 'rejected') => {
        if (!user) return; // Не даем слать запросы, если вышли
        try {
            const response = await fetch(`/api/student-requests/${requestId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            })
            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || 'Ошибка при обновлении статуса заявки')
            }
            toast.success(status === 'approved' ? 'Заявка одобрена' : 'Заявка отклонена')
            const endpoint = isStudent ? '/api/student/stats' : '/api/stats'
            const res = await fetch(endpoint)
            const data = await res.json()
            if (data.success) setStats(data.stats)
        } catch (error: any) {
            toast.error(error.message || 'Ошибка при обновлении статуса заявки')
        } finally {
            setIsLoading(false)
        }
    }

    React.useEffect(() => {
        if (!user) return; // FIX: Не лезем в URL, если логаут
        const paymentStatus = searchParams.get('payment')
        const planParam = searchParams.get('plan')

        if (paymentStatus === 'success') {
            fetch('/api/auth/me')
                .then(res => res.json())
                .then(data => {
                    if (data.success && data.user) {
                        setUser(data.user)
                        setIsPaymentSuccessModalOpen(true)
                        window.history.replaceState({}, '', '/dashboard')
                    }
                })
                .catch(err => console.error('Failed to update user:', err))
        } else {
            const userData = user as any;
            if (userData?.role === 'student' || userData?.isPro) return

            const savedPlan = localStorage.getItem('selectedPlan')
            const finalPlan = (planParam === 'month' || planParam === 'year') ? planParam : savedPlan

            if (finalPlan === 'month' || finalPlan === 'year') {
                setSelectedPlan(finalPlan as 'month' | 'year')
                setIsUpgradeModalOpen(true)
                localStorage.removeItem('selectedPlan')
                if (planParam) {
                    const url = new URL(window.location.href)
                    url.searchParams.delete('plan')
                    window.history.replaceState({}, '', url.pathname + url.search)
                }
            }
        }
    }, [searchParams, setUser, !!user])

    React.useEffect(() => {
        const fetchStats = async () => {
            if (!user) return; // FIX: Главный стопор для запросов при логауте
            try {
                const endpoint = isStudent ? '/api/student/stats' : '/api/stats'
                const response = await fetch(endpoint)
                if (!response.ok) return // Не спамим тостами, если сессия кончилась
                const data = await response.json()
                if (data.success) {
                    setStats(data.stats)
                    if (isStudent && data.stats.teachersCount === 0) {
                        setIsConnectionModalOpen(true)
                    }
                }
            } catch (error) {
                // Молчим, если просто нет сети или сессии
            } finally {
                setIsLoading(false)
            }
        }
        fetchStats()
    }, [isStudent, !!user])

    // 2. Если пользователя нет (совсем!), возвращаем пустой скелет или "ничего"
    // Но благодаря AnimatePresence и замороженной роли, юзер этого даже не увидит, т.к. страница исчезнет раньше
    if (!user && !isLoading) return null;

    return (
        <div>
            <PageHeader
                title="Главная"
                subtitle={isStudent ? "Ваш учебный процесс" : "Обзор вашей активности"}
            />

            <AnimatePresence mode="wait">
                {isTelegramBannerVisible && user && user.role !== 'student' && (
                    <PromotionalBanner
                        key="telegram"
                        variant="telegram"
                        title="Подключите Telegram ассистента"
                        description="Получайте уведомления об уроках и оплатах, управляйте расписанием прямо в Telegram. Это бесплатно и занимает 10 секунд."
                        buttonText="Подключить сейчас"
                        onAction={handleConnectTelegram}
                        onClose={dismissTelegramBanner}
                    />
                )}
                {isReferralBannerVisible && user && user.role !== 'student' && (
                    <PromotionalBanner
                        key="referral"
                        variant="referral"
                        title="Пригласите коллегу — получите месяц PRO"
                        description="За каждого приглашенного репетитора мы дарим 30 дней PRO-подписки вам и вашему другу. Развивайтесь вместе!"
                        buttonText="Пригласить друга"
                        onAction={handleReferralAction}
                        onClose={dismissReferralBanner}
                    />
                )}
            </AnimatePresence>

            <div className={styles.statsContainer}>
                <div className={styles.statsGrid} data-onboarding="dashboard-stats">
                    {isLoading ? (
                        <>
                            <StatCardSkeleton />
                            <StatCardSkeleton />
                            <StatCardSkeleton />
                            <StatCardSkeleton />
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
                                    <StatCard
                                        icon={<SubjectsIcon size={32} color="#14B8A6" />}
                                        label="Мои предметы"
                                        value={stats?.subjectsCount || 0}
                                        href="/student/subjects"
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
                    <div className={styles.requests}>
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
                                                {req.user.avatar ? (
                                                    <img src={req.user.avatar} alt="" className={styles.requestAvatar} />
                                                ) : (
                                                    req.user.firstName?.[0] || req.user.name?.[0] || '?'
                                                )}
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
                                                <CircleXIcon size={16} />
                                                Отклонить
                                            </button>
                                            <button
                                                className={`${styles.actionBtn} ${styles.approveGhost}`}
                                                onClick={() => handleRequestAction(req.id, 'approved')}
                                            >
                                                <CheckIcon size={16} />
                                                Подтвердить
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Section>
                    </div>
                )}

                {!isStudent && stats && (user?.showProgressBlock !== false || user?.showInsightsBlock !== false) && (
                    <div className={styles.progressWrapper}>
                        {user?.showProgressBlock !== false && <CareerProgress stats={stats} />}
                        {user?.showInsightsBlock !== false && <Insights stats={stats} />}
                    </div>
                )}

                <div className={styles.sectionsGrid}>
                    <Section title="Ближайшие занятия" viewAllHref={isStudent ? "/student/lessons" : "/lessons"} viewAllText="Все занятия →">
                        {isLoading ? (
                            <div className={styles.lessonsList}>
                                <LessonCardSkeleton variant="compact" />
                                <LessonCardSkeleton variant="compact" />
                                <LessonCardSkeleton variant="compact" />
                            </div>
                        ) : stats?.upcomingLessons && stats.upcomingLessons.length > 0 ? (
                            <div className={styles.lessonsList}>
                                {stats.upcomingLessons.map((lesson) => (
                                    <LessonCard
                                        key={lesson.id}
                                        lesson={lesson}
                                        variant="compact"
                                        isStudentView={isStudent}
                                        isLocked={checkLessonLock(lesson)}
                                        onLockedAction={(msg) => checkLimit('students', stats?.studentsCount || 100, msg)}
                                    />
                                ))}
                            </div>
                        ) : (
                            <EmptyState title="Нет ближайших занятий" description={undefined} icon={<CalendarIcon size={48} color="var(--primary)" />} />
                        )}
                    </Section>

                    <Section
                        title={isStudent ? "Ожидают оплаты" : "Неоплаченные занятия"}
                        viewAllHref={isStudent ? "/student/lessons?tab=unpaid" : "/lessons?tab=unpaid"}
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
                                    <LessonCard
                                        key={lesson.id}
                                        lesson={lesson}
                                        variant="compact"
                                        isStudentView={isStudent}
                                        isLocked={checkLessonLock(lesson)}
                                        onLockedAction={(msg) => checkLimit('students', stats?.studentsCount || 100, msg)}
                                    />
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

            {UpgradeModal}

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
                                    {req.user.avatar ? (
                                        <img src={req.user.avatar} alt="" className={styles.requestAvatar} />
                                    ) : (
                                        req.user.firstName?.[0] || req.user.name?.[0] || '?'
                                    )}
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

            <PaymentSuccessModal
                isOpen={isPaymentSuccessModalOpen}
                onClose={() => setIsPaymentSuccessModalOpen(false)}
                proExpiresAt={user?.proExpiresAt ? new Date(user.proExpiresAt) : null}
            />

            {
                !isStudent && (
                    <UpgradeToProModal
                        isOpen={isUpgradeModalOpen}
                        onClose={() => setIsUpgradeModalOpen(false)}
                        limitType={upgradeLimitType}
                        defaultPlan={selectedPlan}
                    />
                )
            }
        </div >
    )
}

export default function DashboardPage() {
    return (
        <Suspense fallback={<div>Загрузка...</div>}>
            <DashboardContent />
        </Suspense>
    )
}