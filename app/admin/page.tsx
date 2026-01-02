'use client';
import { useState, useEffect, useMemo } from 'react';
import styles from './admin.module.scss';
import { Switch } from '@/components/ui/Switch';
import { Dropdown } from '@/components/ui/Dropdown';

export default function AdminPage() {
    const [mounted, setMounted] = useState(false);
    const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
    const [password, setPassword] = useState('');
    const [activeTab, setActiveTab] = useState<'sqlite' | 'postgres'>('sqlite');
    const [tables, setTables] = useState<string[]>([]);
    const [selectedTable, setSelectedTable] = useState<string>('');
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [roleFilter, setRoleFilter] = useState<'all' | 'teacher' | 'student'>('all');
    const [teachers, setTeachers] = useState<any[]>([]);
    const [filterTutorId, setFilterTutorId] = useState('');

    useEffect(() => {
        setMounted(true);
    }, []);

    const fetchTeachers = async (db: string) => {
        try {
            const res = await fetch(`/api/admin/data/${db}/User`);
            const json = await res.json();
            if (json.data) {
                setTeachers(json.data.filter((u: any) => u.role === 'teacher'));
            }
        } catch (err) {
            console.error('Failed to fetch teachers:', err);
        }
    };

    useEffect(() => {
        fetch('/api/admin/tables')
            .then(res => {
                if (res.ok) {
                    setIsAuthorized(true);
                    return res.json();
                } else {
                    setIsAuthorized(false);
                    throw new Error('Unauthorized');
                }
            })
            .then(json => setTables(json.models))
            .catch(() => setIsAuthorized(false));

        fetchTeachers(activeTab);
    }, [activeTab]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        const res = await fetch('/api/admin/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password }),
        });

        if (res.ok) {
            window.location.reload();
        } else {
            alert('Неверный пароль');
        }
    };

    const loadData = async (table: string, db: string, tutorId = filterTutorId) => {
        if (!table) return;
        setLoading(true);
        setError('');
        try {
            const url = new URL(`/api/admin/data/${db}/${table}`, window.location.origin);
            if (tutorId) url.searchParams.set('userId', tutorId);

            const res = await fetch(url.toString());
            const json = await res.json();
            if (json.error) throw new Error(json.error);
            setData(json.data);
        } catch (err: any) {
            setError(err.message);
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    const switchTab = (db: 'sqlite' | 'postgres') => {
        setActiveTab(db);
        setSelectedTable('');
        setData([]);
        setFilterTutorId('');
        fetchTeachers(db);
    };

    const handleUpdate = async (id: string, field: string, value: any) => {
        try {
            const res = await fetch(`/api/admin/data/${activeTab}/${selectedTable}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, [field]: value }),
            });
            if (res.ok) {
                setData(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
            } else {
                const json = await res.json();
                alert(json.error || 'Ошибка обновления');
            }
        } catch (err: any) {
            alert(err.message);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Вы уверены?')) return;
        try {
            const res = await fetch(`/api/admin/data/${activeTab}/${selectedTable}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id }),
            });
            if (res.ok) {
                setData(prev => prev.filter(row => row.id !== id));
            }
        } catch (err: any) {
            alert(err.message);
        }
    };

    const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const body: any = {};
        formData.forEach((value, key) => {
            if (value) body[key] = value;
        });

        try {
            const res = await fetch(`/api/admin/data/${activeTab}/${selectedTable}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            if (res.ok) {
                loadData(selectedTable, activeTab);
                e.currentTarget.reset();
            } else {
                const json = await res.json();
                alert(json.error || 'Ошибка добавления');
            }
        } catch (err: any) {
            alert(err.message);
        }
    };

    const filteredData = useMemo(() => {
        if (selectedTable.toLowerCase() === 'user' && roleFilter !== 'all') {
            return data.filter(item => item.role === roleFilter);
        }
        return data;
    }, [data, selectedTable, roleFilter]);

    if (isAuthorized === null) return <div className={styles.loading}>Загрузка...</div>;

    if (!isAuthorized) {
        return (
            <div className={styles.loginContainer}>
                <div className={styles.loginCard}>
                    <h1 className={styles.title}>Tuterra Admin</h1>
                    <form onSubmit={handleLogin} className={styles.loginForm}>
                        <input
                            type="password"
                            placeholder="Пароль администратора"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className={styles.input}
                        />
                        <button type="submit" className={styles.buttonPrimary}>Войти</button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <h1 className={styles.title}>Tuterra Admin</h1>
                <div className={styles.headerRight}>
                    <button
                        onClick={() => fetch('/api/admin/auth', { method: 'DELETE' }).then(() => window.location.reload())}
                        className={styles.buttonSecondary}
                    >
                        Выйти
                    </button>
                </div>
            </header>

            <div className={styles.main}>
                <div className={styles.sidebar}>
                    <section className={styles.section}>
                        <h3 className={styles.sectionTitle}>База данных</h3>
                        <div className={styles.dbTabs}>
                            <button
                                onClick={() => switchTab('sqlite')}
                                className={activeTab === 'sqlite' ? styles.tabActive : styles.tab}
                            >
                                SQLite (Local)
                            </button>
                            <button
                                onClick={() => switchTab('postgres')}
                                className={activeTab === 'postgres' ? styles.tabActive : styles.tab}
                            >
                                Postgres (Prod)
                            </button>
                        </div>
                    </section>

                    <section className={styles.section}>
                        <h3 className={styles.sectionTitle}>Таблицы</h3>
                        <div className={styles.tableList}>
                            {tables.map(t => (
                                <button
                                    key={t}
                                    onClick={() => { setSelectedTable(t); loadData(t, activeTab); setRoleFilter('all'); }}
                                    className={selectedTable === t ? styles.tableItemActive : styles.tableItem}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </section>
                </div>

                <div className={styles.content}>
                    {!selectedTable ? (
                        <div className={styles.emptyState}>Выберите таблицу для просмотра данных</div>
                    ) : (
                        <>
                            <div className={styles.tableHeader}>
                                <div className={styles.tableTitleContainer}>
                                    <h2>{selectedTable}</h2>
                                    {selectedTable.toLowerCase() !== 'user' && (
                                        <div className={styles.tutorFilter}>
                                            <span>Фильтр по преподавателю:</span>
                                            <div style={{ width: '300px' }}>
                                                <Dropdown
                                                    value={filterTutorId}
                                                    onChange={(val) => {
                                                        setFilterTutorId(val);
                                                        loadData(selectedTable, activeTab, val);
                                                    }}
                                                    options={[
                                                        { value: '', label: 'Все преподаватели' },
                                                        ...teachers.map(t => ({
                                                            value: t.id,
                                                            label: `${t.name || t.email} (${t.id.slice(-4)})`
                                                        }))
                                                    ]}
                                                    placeholder="Все преподаватели"
                                                    searchable
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className={styles.headerActions}>
                                    {selectedTable.toLowerCase() === 'user' && (
                                        <div className={styles.roleTabs}>
                                            <button
                                                onClick={() => setRoleFilter('all')}
                                                className={roleFilter === 'all' ? styles.miniTabActive : styles.miniTab}
                                            >
                                                Все
                                            </button>
                                            <button
                                                onClick={() => setRoleFilter('teacher')}
                                                className={roleFilter === 'teacher' ? styles.miniTabActive : styles.miniTab}
                                            >
                                                Преподаватели
                                            </button>
                                            <button
                                                onClick={() => setRoleFilter('student')}
                                                className={roleFilter === 'student' ? styles.miniTabActive : styles.miniTab}
                                            >
                                                Ученики
                                            </button>
                                        </div>
                                    )}
                                    <button onClick={() => loadData(selectedTable, activeTab)} className={styles.buttonPrimary}>
                                        Обновить
                                    </button>
                                </div>
                            </div>

                            {error && <div className={styles.error}>Ошибка: {error}</div>}

                            <div className={styles.card}>
                                <details className={styles.details}>
                                    <summary className={styles.summary}>+ Добавить запись</summary>
                                    <form onSubmit={handleAdd} className={styles.addForm}>
                                        <div className={styles.formGrid}>
                                            {data.length > 0 ? Object.keys(data[0]).filter(k => !['id', 'createdAt', 'updatedAt'].includes(k)).map(key => (
                                                <div key={key} className={styles.formGroup}>
                                                    <label className={styles.label}>{key}</label>
                                                    <input name={key} placeholder={key} className={styles.inputSmall} />
                                                </div>
                                            )) : (
                                                <div className={styles.formGroup}>
                                                    <label className={styles.label}>Name</label>
                                                    <input name="name" placeholder="Name" className={styles.inputSmall} />
                                                </div>
                                            )}
                                        </div>
                                        <button type="submit" className={styles.buttonPrimary}>Сохранить</button>
                                    </form>
                                </details>

                                <div className={styles.tableWrapper}>
                                    {loading ? (
                                        <div className={styles.loading}>Загрузка данных...</div>
                                    ) : (
                                        <table className={styles.table}>
                                            <thead>
                                                <tr>
                                                    {data.length > 0 && Object.keys(data[0]).map(key => (
                                                        <th key={key} className={styles.th}>{key}</th>
                                                    ))}
                                                    <th className={styles.th}>Действия</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredData.map((row, i) => (
                                                    <tr key={row.id || i} className={styles.tr}>
                                                        {Object.entries(row).map(([key, value]) => {
                                                            const isDisabled = selectedTable.toLowerCase() === 'user' && key === 'plan' && row.role === 'student';
                                                            return (
                                                                <td key={key} className={styles.td}>
                                                                    <input
                                                                        defaultValue={String(value ?? '')}
                                                                        disabled={isDisabled}
                                                                        onBlur={(e) => {
                                                                            if (e.target.value !== String(value ?? '')) {
                                                                                handleUpdate(row.id, key, e.target.value);
                                                                            }
                                                                        }}
                                                                        className={`${styles.cellInput} ${isDisabled ? styles.cellInputDisabled : ''}`}
                                                                    />
                                                                </td>
                                                            )
                                                        })}
                                                        <td className={styles.td}>
                                                            <button
                                                                onClick={() => handleDelete(row.id)}
                                                                className={styles.deleteBtn}
                                                            >
                                                                Удалить
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
