'use client';

import { useEffect, useState } from 'react';
import styles from './page.module.scss';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import {
    Wallet,
    Users,
    Ticket,
    Info,
    LayoutGrid,
    Clock,
    CheckCircle2,
    Copy,
    History,
    TrendingUp,
    Gift,
    Zap,
    ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/auth';
import { formatCurrency } from '@/lib/formatUtils';

interface Stats {
    balance: number;
    code: string;
    commissionRate: number;
    commissionPaymentsLimit: number;
    referralsCount: number;
    transactions: any[];
}

export default function PartnerPage() {
    const { user } = useAuthStore();
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isCopying, setIsCopying] = useState(false);

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
        setIsCopying(true);
        toast.success('Ссылка успешно скопирована!');
        setTimeout(() => setIsCopying(false), 2000);
    };

    const requestPayout = () => {
        window.open('https://t.me/tuterrahelp', '_blank');
    };

    if (loading) return (
        <div className={styles.loadingState}>
            <div className={styles.spinner} />
            <p style={{ marginTop: '16px', color: '#8b949e', fontWeight: 600 }}>Загружаем вашу статистику...</p>
        </div>
    );

    if (error) return (
        <div className={styles.errorState}>
            <Info size={48} color="#f85149" />
            <h3 style={{ marginTop: '24px', color: '#fff' }}>Ошибка загрузки</h3>
            <p style={{ color: '#8b949e', marginBottom: '24px' }}>{error}</p>
            <Button onClick={() => window.location.reload()} variant="outline">
                Попробовать снова
            </Button>
        </div>
    );

    if (!stats) return null;

    return (
        <div className={styles.container}>
            {/* Unified Action Center Hero */}
            <div className={styles.heroSection}>
                <div className={styles.balanceBlock}>
                    <span className={styles.label}>Доступно к выводу</span>
                    <div className={styles.value}>
                        {formatCurrency(stats.balance, user?.currency)}
                    </div>
                    <Button
                        className={styles.payoutBtn}
                        onClick={requestPayout}
                        size="large"
                    >
                        Запросить вывод
                    </Button>
                    <div className={styles.payoutLimitSide}>
                        Минимальная сумма: {formatCurrency(1000, user?.currency)}
                    </div>
                </div>

                <div className={styles.promoBlock}>
                    <div className={styles.codeHeader}>
                        <span>Ваш партнерский код</span>
                        {isCopying ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#3fb950', fontSize: '13px', fontWeight: 700 }}>
                                <CheckCircle2 size={16} />
                                Скопировано
                            </div>
                        ) : null}
                    </div>
                    <div className={styles.codeWrapper}>
                        <div className={styles.codeHex}>
                            {stats.code || '...'}
                        </div>
                        <div className={styles.copyBtnIcon} onClick={copyLink} title="Копировать ссылку">
                            {isCopying ? <CheckCircle2 size={24} color="#3fb950" /> : <Copy size={24} />}
                        </div>
                    </div>
                    <div className={styles.referralInfo}>
                        <Users size={16} />
                        <span>Всего приглашено: <strong>{stats.referralsCount}</strong> пользователей</span>
                    </div>
                </div>
            </div>

            <div className={styles.contentLayout}>
                {/* Main Content: History */}
                <div className={styles.mainPanel}>
                    <div className={styles.panelHeader}>
                        <h3>История операций</h3>
                        <span className={styles.limit}>Последние 20 транзакций</span>
                    </div>

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
                                        <td className={styles.dateCell}>{format(new Date(tx.createdAt), 'd MMM, HH:mm', { locale: ru })}</td>
                                        <td className={styles.descCell}>
                                            {tx.description || (tx.type === 'commission' ? 'Партнерское вознаграждение' : tx.type === 'payout' ? 'Вывод средств' : 'Начисление')}
                                        </td>
                                        <td className={tx.amount > 0 ? styles.amountPlus : styles.amountMinus}>
                                            {tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount, user?.currency)}
                                        </td>
                                        <td>
                                            <div className={`${styles.statusBadge} ${styles[tx.status] || ''}`}>
                                                {tx.status === 'completed' ? (
                                                    <><CheckCircle2 size={12} /><span>Выполнено</span></>
                                                ) : (
                                                    <><Clock size={12} /><span>В обработке</span></>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={4}>
                                            <div className={styles.emptyState}>
                                                <LayoutGrid size={48} />
                                                <p>Пока нет операций. Поделитесь ссылкой, чтобы заработать!</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Sidebar: Information & Context */}
                <aside className={styles.sidebar}>
                    <div className={styles.sideCard}>
                        <h4>Условия программы</h4>

                        <div className={styles.featureItem}>
                            <div className={styles.icon}><Zap size={18} /></div>
                            <div>
                                <h5>Комиссия {Math.round(stats.commissionRate * 100)}%</h5>
                                <p>За каждую оплату приглашенного пользователя</p>
                            </div>
                        </div>

                        <div className={styles.featureItem}>
                            <div className={styles.icon}><Gift size={18} /></div>
                            <div>
                                <h5>Бонус клиенту 20%</h5>
                                <p>Скидка на первую покупку для ваших рефералов</p>
                            </div>
                        </div>

                        <div className={styles.featureItem}>
                            <div className={styles.icon}><History size={18} /></div>
                            <div>
                                <h5>Лимит выплат</h5>
                                <p>Комиссия за первые {stats.commissionPaymentsLimit} платежа</p>
                            </div>
                        </div>

                        <div className={styles.featureItem}>
                            <div className={styles.icon}><Info size={18} /></div>
                            <div>
                                <h5>Поддержка</h5>
                                <p>Выплаты производятся по запросу в Telegram</p>
                            </div>
                        </div>
                    </div>

                    <div className={styles.sideCard} style={{ background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.05) 0%, transparent 100%)' }}>
                        <h4 style={{ color: '#58a6ff' }}>Нужна помощь?</h4>
                        <p style={{ fontSize: '13px', color: '#8b949e', lineHeight: 1.6, marginBottom: '20px' }}>
                            Если у вас есть вопросы по партнерской программе или начислениям, напишите нам.
                        </p>
                        <Button
                            variant="outline"
                            fullWidth
                            onClick={() => window.open('https://t.me/tuterrahelp', '_blank')}
                            style={{ borderRadius: '12px', height: '44px', fontSize: '13px' }}
                        >
                            <ExternalLink size={14} style={{ marginRight: '8px' }} />
                            Написать в поддержку
                        </Button>
                    </div>
                </aside>
            </div>
        </div>
    );
}
