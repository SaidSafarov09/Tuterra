'use client';

import React, { useEffect, useState } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import styles from './layout.module.scss';
import { Logo } from '@/components/icons/Logo';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, LogOut, User as UserIcon } from 'lucide-react';


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
        <div style={{
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#f8fafc'
        }}>
            <div className={styles.spinner} />
        </div>
    );

    if (!user) return null;

    const isPartner = (user as any).isPartner;
    if (!isPartner) {
        return (
            <div className={styles.accessDenied}>
                <h1>Доступ запрещен</h1>
                <p>Этот раздел доступен только для партнеров проекта.</p>
                <Button onClick={() => router.push('/dashboard')}>
                    Вернуться в дашборд
                </Button>
            </div>
        )
    }

    return (
        <div className={styles.layout}>
            <header className={styles.header}>
                <div className={styles.headerLeft}>
                    <Link href="/partner" className={styles.logo}>
                        <Logo size={32} />
                        <h1>Tuterra Partner</h1>
                    </Link>
                </div>

                <div className={styles.userMenu}>
                    <Link href="/dashboard" className={styles.appLink}>
                        <ArrowLeft size={18} />
                        <span className={styles.appLinkText}>В приложение</span>
                    </Link>

                    <div className={styles.divider} />

                    <div className={styles.userInfo}>
                        <div className={styles.userAvatar}>
                            {user.avatar ? (
                                <img src={user.avatar} alt={user.name || 'User'} className={styles.avatarImg} />
                            ) : (
                                <UserIcon size={16} />
                            )}
                        </div>
                        <span className={styles.userEmail}>{user.email}</span>
                    </div>


                    <button onClick={handleLogout} className={styles.logoutBtn} title="Выйти">
                        <span className={styles.logoutText}>Выйти</span>
                        <LogOut size={18} />
                    </button>
                </div>
            </header>

            <main className={styles.main}>
                {children}
            </main>
        </div>
    );
}

