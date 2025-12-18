'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    DashboardIcon,
    StudentsIcon,
    LessonsIcon,
    CalendarIcon,
    UsersGroupIcon,
    PaymentsIcon,
    HistoryIcon,
    UserIcon,
    ArrowLeftIcon,
    ArrowRightIcon,
    HomeIcon,
    MenuIcon,
    CloseIcon
} from '@/components/icons/Icons'
import { Logo as AppLogo } from '@/components/icons/Logo'
import {
    Clock,
    CheckCircle2
} from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatCard } from '@/components/ui/StatCard'
import { Section } from '@/components/ui/Section'
import { LessonCard } from '@/components/ui/LessonCard'
import { CalendarGrid } from '@/components/calendar/CalendarGrid'
import { CalendarWeekDays } from '@/components/calendar/CalendarWeekDays'
import { GroupsList } from '@/components/groups/GroupsList'
import { SubjectCard } from '@/components/subjects/SubjectCard'
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line
} from 'recharts'
import styles from './ProductDemo.module.scss'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { TabNav } from '../ui/TabNav'
import { LESSON_TABS } from '@/constants'

// Mock Data
const mockSubjects = [
    { id: '1', name: 'Математика', color: '#4A6CF7' },
    { id: '2', name: 'Английский', color: '#10B981' },
    { id: '3', name: 'Физика', color: '#F59E0B' },
]

const mockStudents = [
    {
        id: 's1',
        name: 'Александр Петров',
        subjects: [mockSubjects[0]],
        _count: { lessons: 12 },
    },
    {
        id: 's2',
        name: 'Мария Сидорова',
        subjects: [mockSubjects[1]],
        _count: { lessons: 8 },
    }
] as any

const mockLessons = [
    {
        id: 'l1',
        date: new Date(2025, 0, 15, 14, 0).toISOString(),
        duration: 60,
        price: 2500,
        isPaid: false,
        isCanceled: false,
        topic: 'Решение квадратных уравнений',
        student: mockStudents[0],
        subject: mockSubjects[0],
    },
    {
        id: 'l2',
        date: new Date(2025, 0, 16, 16, 30).toISOString(),
        duration: 90,
        price: 2000,
        isPaid: true,
        isCanceled: false,
        topic: 'Разбор времен: Present Perfect',
        student: mockStudents[1],
        subject: mockSubjects[1],
    }
] as any

const mockGroups = [
    {
        id: 'g1',
        name: 'ЕГЭ Профильный уровень',
        note: 'Группа из 5 человек, подготовка ко второй части',
        subject: mockSubjects[0],
        _count: { students: 5, lessons: 24 }
    },
    {
        id: 'g2',
        name: 'Elementary A1',
        note: 'Вечерняя группа, интенсив',
        subject: mockSubjects[1],
        _count: { students: 8, lessons: 48 }
    }
] as any

const mockMonthlyData = [
    { month: 'Сент', income: 45000, paid: 20, unpaid: 2 },
    { month: 'Окт', income: 52000, paid: 24, unpaid: 1 },
    { month: 'Нояб', income: 48000, paid: 22, unpaid: 3 },
    { month: 'Дек', income: 85000, paid: 35, unpaid: 0 },
    { month: 'Янв', income: 124500, paid: 48, unpaid: 1 },
]

export const ProductDemo = () => {
    const isTouch = useMediaQuery('(pointer: coarse)')
    const [activeNav, setActiveNav] = useState('dashboard')
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const MotionDiv = isTouch ? 'div' : motion.div;

    const navigationLinks = [
        { id: 'dashboard', name: 'Главная', icon: DashboardIcon },
        { id: 'lessons', name: 'Занятия', icon: LessonsIcon },
        { id: 'groups', name: 'Группы', icon: UsersGroupIcon },
        { id: 'calendar', name: 'Календарь', icon: CalendarIcon },
        { id: 'income', name: 'Доходы', icon: PaymentsIcon },
    ]

    const DEMO_DATE = new Date(2025, 0, 1)

    const handleNavClick = (id: string) => {
        setActiveNav(id)
        setIsMobileMenuOpen(false)
    }

    return (
        <section id="demo" className={styles.section}>
            <div className={styles.container}>
                <div className={styles.header}>
                    <h2>Посмотрите, как выглядит рабочий день репетитора</h2>
                    <p>
                        Минимум лишнего. Только то, чем вы действительно пользуетесь каждый день.
                    </p>
                </div>

                {/* App Interface Mockup */}
                <div className={styles.appFrame}>

                    {/* Mobile Header */}
                    <div className={styles.mobileHeader}>
                        <div className={styles.mobileLogo}>
                            <AppLogo size={28} />
                            <span>Tuterra</span>
                        </div>
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className={styles.menuToggle}
                        >
                            {isMobileMenuOpen ? <CloseIcon size={24} /> : <MenuIcon size={24} />}
                        </button>
                    </div>

                    <div className={styles.inner}>
                        {/* Mock Sidebar */}
                        <aside className={`${styles.sidebar} ${isMobileMenuOpen ? styles.open : ''}`}>
                            <div className={styles.sidebarLogo}>
                                <AppLogo size={32} />
                                <span>Tuterra</span>
                            </div>

                            <nav className={styles.sidebarNav}>
                                {navigationLinks.map((link) => (
                                    <button
                                        key={link.id}
                                        onClick={() => handleNavClick(link.id)}
                                        className={`${styles.navItem} ${activeNav === link.id ? styles.active : styles.inactive}`}
                                    >
                                        <link.icon size={20} />
                                        <span>{link.name}</span>
                                    </button>
                                ))}
                            </nav>

                            <div className={styles.sidebarFooter}>
                                <div className={styles.userInfo}>
                                    <div className={styles.avatar}>ДВ</div>
                                    <div className={styles.details}>
                                        <div className={styles.name}>Дмитрий Волков</div>
                                        <div className={styles.role}>Преподаватель</div>
                                    </div>
                                </div>
                            </div>
                        </aside>

                        {/* Sidebar Overlay for Mobile */}
                        {isMobileMenuOpen && (
                            <div
                                className={styles.sidebarOverlay}
                                onClick={() => setIsMobileMenuOpen(false)}
                            />
                        )}

                        {/* Mock Content Area */}
                        <main className={styles.main}>
                            <div className={styles.content}>
                                <AnimatePresence mode="wait">
                                    {activeNav === 'dashboard' && (
                                        <MotionDiv
                                            key="dashboard"
                                            {...(isTouch ? {} : {
                                                initial: { opacity: 0, y: 10 },
                                                animate: { opacity: 1, y: 0 },
                                                exit: { opacity: 0, y: -10 }
                                            })}
                                        >
                                            <PageHeader title="Главная" subtitle="Обзор вашей активности" />

                                            <div className={styles.statsGrid}>
                                                <StatCard icon={<StudentsIcon size={32} color="#3B82F6" />} label="Ученики" value="14" />
                                                <StatCard icon={<UsersGroupIcon size={32} color="#F59E0B" />} label="Группы" value="3" />
                                                <StatCard icon={<CalendarIcon size={32} color="#4A6CF7" />} label="Занятий в январе" value="48" />
                                                <StatCard icon={<PaymentsIcon size={32} color="#10B981" />} label="Доход за месяц" value="124,500 ₽" />
                                            </div>

                                            <div className={styles.sectionsGrid}>
                                                <Section title="Ближайшие занятия" viewAllHref="#">
                                                    <div className={styles.innerSection}>
                                                        {mockLessons.map((lesson: any) => (
                                                            <LessonCard key={lesson.id} lesson={lesson} variant="compact" />
                                                        ))}
                                                    </div>
                                                </Section>
                                                <Section title="Неоплаченные занятия" viewAllHref="#">
                                                    <div className={styles.innerSection}>
                                                        <LessonCard lesson={{ ...mockLessons[0], isPaid: false }} variant="compact" />
                                                        <div className={styles.emptyState}>
                                                            <CheckCircle2 size={32} className={styles.icon} />
                                                            <div className={styles.text}>Все остальные счета оплачены</div>
                                                        </div>
                                                    </div>
                                                </Section>
                                            </div>
                                        </MotionDiv>
                                    )}

                                    {activeNav === 'calendar' && (
                                        <MotionDiv
                                            key="calendar"
                                            {...(isTouch ? {} : {
                                                initial: { opacity: 0 },
                                                animate: { opacity: 1 }
                                            })}
                                        >
                                            <div style={{ marginBottom: '32px' }}>
                                                <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#1A1A1A' }}>Январь 2026</h2>
                                            </div>
                                            <div className={styles.calendarFrame}>
                                                <div className={styles.scrollable}>
                                                    <CalendarWeekDays />
                                                    <CalendarGrid currentMonth={DEMO_DATE} lessons={mockLessons} onDateClick={() => { }} />
                                                </div>
                                            </div>
                                        </MotionDiv>
                                    )}

                                    {activeNav === 'groups' && (
                                        <MotionDiv
                                            key="groups"
                                            {...(isTouch ? {} : {
                                                initial: { opacity: 0 },
                                                animate: { opacity: 1 }
                                            })}
                                        >
                                            <PageHeader title="Группы" subtitle="Управляйте списком ваших групп" />
                                            <GroupsList groups={mockGroups} />
                                        </MotionDiv>
                                    )}

                                    {activeNav === 'lessons' && (
                                        <MotionDiv
                                            key="lessons"
                                            {...(isTouch ? {} : {
                                                initial: { opacity: 0 },
                                                animate: { opacity: 1 }
                                            })}
                                        >
                                            <PageHeader title="Занятия" subtitle="Управление расписанием" />
                                            <div className={styles.cardList}>
                                                <TabNav
                                                    tabs={LESSON_TABS}
                                                    activeTab={LESSON_TABS[1]}
                                                    onTabChange={() => { }}
                                                />
                                                {mockLessons.map((lesson: any) => (
                                                    <LessonCard key={lesson.id} lesson={lesson} variant="default" />
                                                ))}
                                                <div className={styles.subjectsGrid}>
                                                    {mockSubjects.map(sub => (
                                                        <SubjectCard
                                                            key={sub.id}
                                                            subject={sub as any}
                                                            onEdit={() => { }}
                                                            onDelete={() => { }}
                                                            onClick={() => { }}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        </MotionDiv>
                                    )}

                                    {activeNav === 'income' && (
                                        <MotionDiv
                                            key="income"
                                            {...(isTouch ? {} : {
                                                initial: { opacity: 0 },
                                                animate: { opacity: 1 }
                                            })}
                                            style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}
                                        >
                                            <PageHeader title="Доходы" subtitle="Аналитика ваших доходов" />

                                            {/* Navigation mockup */}
                                            <div className={styles.incomeNav}>
                                                <button><ArrowLeftIcon size={18} /></button>
                                                <div className={styles.current}>Январь 2026</div>
                                                <button style={{ opacity: 0.5 }} disabled><ArrowRightIcon size={18} /></button>
                                            </div>

                                            <div className={styles.incomeCardsGrid}>
                                                {/* Income Card */}
                                                <div className={styles.incomeCard}>
                                                    <div className={styles.cardTop}>
                                                        <h3>Доход за месяц</h3>
                                                        <div className={styles.badge}>↑ 18.2%</div>
                                                    </div>
                                                    <div className={styles.amount}>124,500 ₽</div>
                                                    <p className={styles.desc}>Итого заработано за Январь 2025</p>
                                                    <div className={styles.hoursBox}>
                                                        <Clock size={16} color="#4A6CF7" />
                                                        <span>Рабочие часы - <strong>48ч 30м</strong></span>
                                                    </div>
                                                </div>

                                                {/* Recent Transactions */}
                                                <div className={styles.transactionList}>
                                                    <div className={styles.listHeader}>
                                                        <h3>Последние операции</h3>
                                                        <HistoryIcon size={20} color="#6B7280" />
                                                    </div>
                                                    <div className={styles.list}>
                                                        {[
                                                            { name: 'Александр Петров', sub: 'Математика', amount: '+2,500 ₽' },
                                                            { name: 'ЕГЭ Профильный', sub: 'Математика', amount: '+7,200 ₽' },
                                                            { name: 'Мария Сидорова', sub: 'Английский', amount: '+2,000 ₽' }
                                                        ].map((tx, i) => (
                                                            <div key={i} className={styles.txItem}>
                                                                <div className={styles.txLeft}>
                                                                    <div className={styles.txIcon}><UserIcon size={16} /></div>
                                                                    <div className={styles.txInfo}>
                                                                        <div className={styles.name}>{tx.name}</div>
                                                                        <div className={styles.sub}>{tx.sub}</div>
                                                                    </div>
                                                                </div>
                                                                <div className={styles.txAmount}>{tx.amount}</div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Charts Mockup */}
                                            <div className={styles.chartsGrid}>
                                                <div className={styles.chartCard}>
                                                    <h3>График доходов</h3>
                                                    <div className={styles.chartContainer}>
                                                        <ResponsiveContainer width="100%" height="100%">
                                                            <LineChart data={mockMonthlyData}>
                                                                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                                                                <XAxis dataKey="month" stroke="#9CA3AF" fontSize={10} tickLine={false} axisLine={false} />
                                                                <YAxis stroke="#9CA3AF" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `${v / 1000}k`} />
                                                                <Tooltip
                                                                    contentStyle={{
                                                                        backgroundColor: '#FFFFFF',
                                                                        border: '1px solid #E5E7EB',
                                                                        borderRadius: '8px',
                                                                        fontSize: '12px'
                                                                    }}
                                                                />
                                                                <Line
                                                                    type="monotone"
                                                                    dataKey="income"
                                                                    stroke="#4A6CF7"
                                                                    strokeWidth={3}
                                                                    dot={{ fill: '#4A6CF7', r: 4 }}
                                                                    activeDot={{ r: 6 }}
                                                                />
                                                            </LineChart>
                                                        </ResponsiveContainer>
                                                    </div>
                                                </div>

                                                <div className={styles.chartCard}>
                                                    <h3>Занятия</h3>
                                                    <div className={styles.chartContainer}>
                                                        <ResponsiveContainer width="100%" height="100%">
                                                            <BarChart data={mockMonthlyData}>
                                                                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                                                                <XAxis dataKey="month" stroke="#9CA3AF" fontSize={10} tickLine={false} axisLine={false} />
                                                                <YAxis stroke="#9CA3AF" fontSize={10} tickLine={false} axisLine={false} />
                                                                <Tooltip
                                                                    contentStyle={{
                                                                        backgroundColor: '#FFFFFF',
                                                                        border: '1px solid #E5E7EB',
                                                                        borderRadius: '8px',
                                                                        fontSize: '12px'
                                                                    }}
                                                                />
                                                                <Bar dataKey="paid" fill="#10B981" radius={[4, 4, 0, 0]} name="Оплачено" />
                                                                <Bar dataKey="unpaid" fill="#F59E0B" radius={[4, 4, 0, 0]} name="Долг" />
                                                            </BarChart>
                                                        </ResponsiveContainer>
                                                    </div>
                                                </div>
                                            </div>
                                        </MotionDiv>
                                    )}
                                </AnimatePresence>
                            </div>
                        </main>
                    </div>
                </div>
            </div>
        </section>
    )
}
