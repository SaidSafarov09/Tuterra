'use client'

import React from 'react'
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
import { MonthlyData } from '@/types'
import styles from '../../app/(dashboard)/income/page.module.scss'
import { useAuthStore } from '@/store/auth'
import { formatCurrency } from '@/lib/formatUtils'

interface IncomeChartsProps {
    data: MonthlyData[]
}

export const IncomeCharts: React.FC<IncomeChartsProps> = ({ data }) => {
    const { user } = useAuthStore()
    if (!data || data.length === 0) return null

    return (
        <div className={styles.chartsGrid}>
            <div className={styles.chartSection}>
                <h2 className={styles.chartTitle}>График доходов</h2>
                <div className={styles.chart}>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                            <XAxis
                                dataKey="month"
                                stroke="var(--text-secondary)"
                                style={{ fontSize: '12px' }}
                            />
                            <YAxis
                                stroke="var(--text-secondary)"
                                style={{ fontSize: '12px' }}
                                tickFormatter={(value) => formatCurrency(value, user?.currency)}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'var(--surface)',
                                    border: '1px solid var(--border)',
                                    borderRadius: '8px',
                                    fontSize: '12px',
                                }}
                                formatter={(value: number) => formatCurrency(value, user?.currency)}
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
                        <BarChart data={data}>
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
    )
}
