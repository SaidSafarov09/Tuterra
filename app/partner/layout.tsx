'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import styles from './layout.module.scss';
import { Logo } from '@/components/icons/Logo';
import { toast } from 'sonner';

export default function PartnerLayout({ children }: { children: React.ReactNode }) {
    const { user, logout, setUser } = useAuthStore();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Try to fetch user if missing but potentially logged in (e.g. fresh page load)
    useEffect(() => {
        const fetchUser = async () => {
            if (!user) {
                try {
                    const { settingsApi } = await import('@/services/api');
                    const data = await settingsApi.get();
                    setUser(data as any);
                } catch (e) {
                    // If fetch fails, we are probably not logged in
                    // router.replace('/auth'); // Let the next effect handle it
                }
            }
            setLoading(false);
        };

        if (mounted) {
            fetchUser();
        }
    }, [mounted, user, setUser]);

    useEffect(() => {
        if (!loading && mounted && !user) {
            router.replace('/auth');
        }
    }, [user, mounted, loading, router]);

    const handleLogout = async () => {
        await logout();
        router.push('/auth');
    };

    if (!mounted || loading) return (
        // Simple Loading State
        <div style={{
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#f8fafc'
        }}>
            <div style={{
                width: '40px',
                height: '40px',
                border: '3px solid rgba(99, 102, 241, 0.2)',
                borderTopColor: '#6366f1',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
            }} />
            <style jsx>{`
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );

    if (!user) return null;

    const isPartner = (user as any).isPartner;
    if (!isPartner) {
        return (
            <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem' }}>
                <h1>Доступ запрещен</h1>
                <p>Этот раздел доступен только для партнеров проекта.</p>
                <button onClick={() => router.push('/dashboard')} style={{ padding: '10px 20px', cursor: 'pointer' }}>
                    Вернуться в дашборд
                </button>
            </div>
        )
    }

    return (
        <div className={styles.layout}>
            <header className={styles.header}>
                <Link href="/partner" className={styles.logo}>
                    <Logo size={32} />
                    <h1>Tuterra Partner</h1>
                </Link>

                <div className={styles.userMenu}>
                    <Link href="/dashboard" className={styles.appLink}>
                        <span className={styles.appLinkIcon}>←</span>
                        <span className={styles.appLinkText}>В приложение</span>
                    </Link>
                    <span className={styles.userEmail}>{user.email}</span>
                    <button onClick={handleLogout} className={styles.logoutBtn}>
                        <span className={styles.logoutText}>Выйти</span>
                        <span className={styles.logoutIcon}>⎋</span>
                    </button>
                </div>
            </header>

            <main className={styles.main}>
                {children}
            </main>
        </div>
    );
}
