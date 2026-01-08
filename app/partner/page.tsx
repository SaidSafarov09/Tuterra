'use client';

import { useEffect, useState } from 'react';
import styles from './page.module.scss';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface Stats {
    balance: number;
    code: string;
    commissionRate: number;
    commissionPaymentsLimit: number;
    referralsCount: number;
    transactions: any[];
}

export default function PartnerPage() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);

    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch('/api/partner/stats')
            .then(res => {
                if (res.status === 403) throw new Error('Нет доступа (403). Попробуйте перелогиниться.');
                if (res.status === 401) throw new Error('Не авторизован');
                if (!res.ok) throw new Error(`Ошибка сервера: ${res.status}`);
                return res.json();
            })
            .then(data => setStats(data))
            .catch(err => {
                console.error(err);
                setError(err.message || 'Неизвестная ошибка');
            })
            .finally(() => setLoading(false));
    }, []);

    const copyLink = () => {
        if (!stats?.code) return;
        const origin = typeof window !== 'undefined' ? window.location.origin : 'https://tuterra.online';
        const url = `${origin}/?inviteRef=${stats.code}`;
        navigator.clipboard.writeText(url);
        toast.success('Ссылка скопирована в буфер обмена!');
    };

    const requestPayout = () => {
        window.open('https://t.me/tuterrahelp', '_blank'); // Direct contact for payout
    };

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Загрузка статистики...</div>;

    if (error) return (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#ef4444' }}>
            <h3>Ошибка загрузки</h3>
            <p>{error}</p>
            <button onClick={() => window.location.reload()} style={{ marginTop: '1rem', padding: '8px 16px', cursor: 'pointer' }}>
                Попробовать снова
            </button>
        </div>
    );

    if (!stats) return null;

    return (
        <div className={styles.container}>
            <div className={styles.intro}>
                <h2>Партнерская программа</h2>
                <p>Ваша статистика и доходы в реальном времени</p>
            </div>

            <div className={styles.grid}>
                {/* Balance */}
                <div className={styles.card}>
                    <div className={styles.cardContent}>
                        <div className={styles.cardLabel}>Доступно к выводу</div>
                        <div className={styles.balanceValue}>
                            {stats.balance.toLocaleString('ru-RU')} <span>₽</span>
                        </div>
                        <button className={styles.actionButton} onClick={requestPayout}>
                            Запросить вывод
                        </button>
                        <p style={{ marginTop: '1.5rem', fontSize: '0.9rem', color: '#94a3b8', fontWeight: 500 }}>
                            Мин. сумма вывода: 1000 ₽
                        </p>
                    </div>
                </div>

                {/* Promo Code */}
                <div className={styles.card}>
                    <div className={styles.cardContent}>
                        <div className={styles.cardLabel}>Ваш Промокод</div>
                        <div className={styles.codeDisplay} onClick={copyLink} title="Скопировать ссылку">
                            {stats.code || '...'}
                        </div>
                        <p style={{ color: '#64748b', fontSize: '1.1rem', marginBottom: '2rem' }}>
                            Приглашено: <strong style={{ color: '#0f172a' }}>{stats.referralsCount}</strong> пользователей
                        </p>
                        <button className={`${styles.actionButton} ${styles.secondary}`} onClick={copyLink}>
                            Скопировать ссылку
                        </button>
                    </div>
                </div>
            </div>

            {/* Program Terms */}
            <div className={styles.termsCard}>
                <h3>📋 Условия вашей партнерской программы</h3>
                <div className={styles.termsList}>
                    <div className={styles.termItem}>
                        <span className={styles.termIcon}>💰</span>
                        <div>
                            <strong>Комиссия:</strong> {Math.round(stats.commissionRate * 100)}% от каждой оплаты приглашенного пользователя
                        </div>
                    </div>
                    <div className={styles.termItem}>
                        <span className={styles.termIcon}>🎁</span>
                        <div>
                            <strong>Скидка для клиентов:</strong> 20% на первую покупку подписки
                        </div>
                    </div>
                    <div className={styles.termItem}>
                        <span className={styles.termIcon}>🔢</span>
                        <div>
                            <strong>Количество оплат с комиссией:</strong> первые {stats.commissionPaymentsLimit} платежа от каждого пользователя
                        </div>
                    </div>
                    <div className={styles.termItem}>
                        <span className={styles.termIcon}>ℹ️</span>
                        <div>
                            После {stats.commissionPaymentsLimit}-х оплат пользователь остается в системе, но комиссия больше не начисляется
                        </div>
                    </div>
                </div>
            </div>

            <div className={styles.historySection}>
                <h3>
                    История операций
                    <span style={{ fontSize: '0.9rem', fontWeight: 500, color: '#94a3b8' }}>Последние 20</span>
                </h3>
                <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Дата</th>
                                <th>Описание</th>
                                <th>Сумма</th>
                                <th>Статус</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats.transactions.length > 0 ? stats.transactions.map((tx: any) => (
                                <tr key={tx.id}>
                                    <td>{format(new Date(tx.createdAt), 'd MMM, HH:mm', { locale: ru })}</td>
                                    <td style={{ fontWeight: 600, color: '#334155' }}>{tx.description || 'Начисление'}</td>
                                    <td className={tx.amount > 0 ? styles.amountPlus : styles.amountMinus}>
                                        {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString('ru-RU')} ₽
                                    </td>
                                    <td>
                                        <span className={`${styles.statusBadge} ${styles[tx.status] || ''}`}>
                                            {tx.status === 'completed' ? 'Выполнено' : 'В обработке'}
                                        </span>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={4} style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>
                                        Пока нет операций. Поделитесь ссылкой, чтобы начать!
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
