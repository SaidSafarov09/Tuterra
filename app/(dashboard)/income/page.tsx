'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { format, subMonths, addMonths } from 'date-fns'
import { ru } from 'date-fns/locale'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import { ArrowLeftIcon, ArrowRightIcon } from '@/components/icons/Icons'
import { Button } from '@/components/ui/Button'
import styles from './page.module.scss'

interface MonthlyData {
    month: string
    income: number
    lessons: number
    paid: number
    unpaid: number
}

export default function IncomePage() {
    const router = useRouter()
    const [currentDate, setCurrentDate] = useState(new Date())
    const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([])
    const [currentMonthIncome, setCurrentMonthIncome] = useState(0)
    const [previousMonthIncome, setPreviousMonthIncome] = useState(0)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        fetchIncomeData()
    }, [currentDate])

    const fetchIncomeData = async () => {
        try {
            const response = await fetch(`/api/income?date=${currentDate.toISOString()}`)
            if (response.ok) {
                const data = await response.json()
                setMonthlyData(data.monthlyData || [])
                setCurrentMonthIncome(data.currentMonthIncome || 0)
                setPreviousMonthIncome(data.previousMonthIncome || 0)
            } else {
                toast.error('Не удалось загрузить данные о доходах')
            }
        } catch (error) {
            toast.error('Произошла ошибка при загрузке данных')
        } finally {
            setIsLoading(false)
        }
    }

    const handlePreviousMonth = () => {
        setCurrentDate(subMonths(currentDate, 1))
    }

    const handleNextMonth = () => {
        setCurrentDate(addMonths(currentDate, 1))
    }

    const handleToday = () => {
        setCurrentDate(new Date())
    }

    const percentageChange =
        previousMonthIncome > 0
            ? ((currentMonthIncome - previousMonthIncome) / previousMonthIncome) * 100
            : currentMonthIncome > 0
                ? 100
                : 0

    const isGrowth = percentageChange >= 0
    const isNextMonthDisabled = addMonths(currentDate, 1) > new Date()

    if (isLoading) {
        return <div className={styles.loading}>Загрузка...</div>
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <button className={styles.backButton} onClick={() => router.back()}>
                    <ArrowLeftIcon size={20} />
                    <span>Назад</span>
                </button>
                <div className={styles.headerText}>
                    <h1 className={styles.title}>Статистика доходов</h1>
                    <p className={styles.subtitle}>Анализ ваших доходов за период</p>
                </div>
            </div>

            <div className={styles.navigation}>
                <button className={styles.navButton} onClick={handlePreviousMonth}>
                    <ArrowLeftIcon size={18} />
                </button>
                <div className={styles.currentMonth}>
                    {format(currentDate, 'LLLL yyyy', { locale: ru })}
                </div>
                <button
                    className={styles.navButton}
                    onClick={handleNextMonth}
                    disabled={isNextMonthDisabled}
                    style={{ opacity: isNextMonthDisabled ? 0.5 : 1, cursor: isNextMonthDisabled ? 'not-allowed' : 'pointer' }}
                >
                    <ArrowRightIcon size={18} />
                </button>
                <Button variant="ghost" size="small" onClick={handleToday}>
                    Сегодня
                </Button>
            </div>

            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <div className={styles.statHeader}>
                        <h3 className={styles.statTitle}>Доход за месяц</h3>
                        <div className={`${styles.badge} ${isGrowth ? styles.badgeSuccess : styles.badgeDanger}`}>
                            {isGrowth ? '↑' : '↓'} {Math.abs(percentageChange).toFixed(1)}%
                        </div>
                    </div>
                    <div className={styles.statValue}>{currentMonthIncome.toLocaleString()} ₽</div>
                    <p className={styles.statDescription}>
                        Итого заработано: <strong>{currentMonthIncome.toLocaleString()} ₽</strong>
                        <br />
                        <span style={{ fontSize: '13px', opacity: 0.8 }}>
                            {isGrowth ? 'Рост' : 'Снижение'} на {Math.abs(currentMonthIncome - previousMonthIncome).toLocaleString()} ₽
                        </span>
                    </p>
                </div>

                {previousMonthIncome > 0 && (
                    <div className={styles.statCard}>
                        <h3 className={styles.statTitle}>Предыдущий месяц</h3>
                        <div className={styles.statValue}>{previousMonthIncome.toLocaleString()} ₽</div>
                        <p className={styles.statDescription}>
                            {format(subMonths(currentDate, 1), 'LLLL yyyy', { locale: ru })}
                        </p>
                    </div>
                )}
            </div>

            {monthlyData.length > 0 && (
                <div className={styles.chartsGrid}>
                    <div className={styles.chartSection}>
                        <h2 className={styles.chartTitle}>График доходов</h2>
                        <div className={styles.chart}>
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={monthlyData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                    <XAxis
                                        dataKey="month"
                                        stroke="var(--text-secondary)"
                                        style={{ fontSize: '12px' }}
                                    />
                                    <YAxis
                                        stroke="var(--text-secondary)"
                                        style={{ fontSize: '12px' }}
                                        tickFormatter={(value) => `${value.toLocaleString()} ₽`}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'var(--surface)',
                                            border: '1px solid var(--border)',
                                            borderRadius: '8px',
                                            fontSize: '12px',
                                        }}
                                        formatter={(value: number) => `${value.toLocaleString()} ₽`}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="income"
                                        stroke="var(--primary)"
                                        strokeWidth={3}
                                        dot={{ fill: 'var(--primary)', r: 4 }}
                                        activeDot={{ r: 6 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className={styles.chartSection}>
                        <h2 className={styles.chartTitle}>Количество занятий</h2>
                        <div className={styles.chart}>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={monthlyData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                    <XAxis
                                        dataKey="month"
                                        stroke="var(--text-secondary)"
                                        style={{ fontSize: '12px' }}
                                    />
                                    <YAxis stroke="var(--text-secondary)" style={{ fontSize: '12px' }} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'var(--surface)',
                                            border: '1px solid var(--border)',
                                            borderRadius: '8px',
                                            fontSize: '12px',
                                        }}
                                    />
                                    <Bar dataKey="paid" fill="var(--success)" name="Оплаченные" radius={[8, 8, 0, 0]} />
                                    <Bar dataKey="unpaid" fill="var(--warning)" name="Неоплаченные" radius={[8, 8, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
