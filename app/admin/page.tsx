'use client';

import { useState, useEffect, useMemo } from 'react';

export default function AdminPage() {
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
    }, []);

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
            const row = data.find(r => r.id === id);
            const isStudent = (row?.role === 'student' && field !== 'role') || (field === 'role' && value === 'student');

            let finalValue = value;
            if (isStudent && (field === 'plan' || (field === 'role' && value === 'student'))) {
                if (field === 'plan' && isStudent && value && value !== 'null') {
                    alert('У учеников не может быть плана');
                    return;
                }
            }

            const res = await fetch(`/api/admin/data/${activeTab}/${selectedTable}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, [field]: finalValue }),
            });
            if (res.ok) {
                // local update for speed
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
            if (selectedTable.toLowerCase() === 'user' && body.role === 'student' && body.plan) {
                body.plan = null;
            }

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

    if (isAuthorized === null) return <div style={styles.loading}>Загрузка...</div>;

    if (!isAuthorized) {
        return (
            <div style={styles.loginContainer}>
                <div style={styles.loginCard}>
                    <h1 style={styles.title}>Tuterra Admin</h1>
                    <form onSubmit={handleLogin} style={styles.loginForm}>
                        <input
                            type="password"
                            placeholder="Пароль администратора"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={styles.input}
                        />
                        <button type="submit" style={styles.buttonPrimary}>Войти</button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.page}>
            <header style={styles.header}>
                <h1 style={styles.title}>Tuterra Admin</h1>
                <button
                    onClick={() => fetch('/api/admin/auth', { method: 'DELETE' }).then(() => window.location.reload())}
                    style={styles.buttonSecondary}
                >
                    Выйти
                </button>
            </header>

            <div style={styles.main}>
                <div style={styles.sidebar}>
                    <section style={styles.section}>
                        <h3 style={styles.sectionTitle}>База данных</h3>
                        <div style={styles.dbTabs}>
                            <button
                                onClick={() => switchTab('sqlite')}
                                style={activeTab === 'sqlite' ? styles.tabActive : styles.tab}
                            >
                                SQLite (Local)
                            </button>
                            <button
                                onClick={() => switchTab('postgres')}
                                style={activeTab === 'postgres' ? styles.tabActive : styles.tab}
                            >
                                Postgres (Prod)
                            </button>
                        </div>
                    </section>

                    <section style={styles.section}>
                        <h3 style={styles.sectionTitle}>Таблицы</h3>
                        <div style={styles.tableList}>
                            {tables.map(t => (
                                <button
                                    key={t}
                                    onClick={() => { setSelectedTable(t); loadData(t, activeTab); setRoleFilter('all'); }}
                                    style={selectedTable === t ? styles.tableItemActive : styles.tableItem}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </section>
                </div>

                <div style={styles.content}>
                    {!selectedTable ? (
                        <div style={styles.emptyState}>Выберите таблицу для просмотра данных</div>
                    ) : (
                        <>
                            <div style={styles.tableHeader}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <h2 style={{ margin: 0 }}>{selectedTable}</h2>
                                    {selectedTable.toLowerCase() !== 'user' && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span style={{ fontSize: '0.8rem', color: '#6c757d' }}>Фильтр по преподавателю:</span>
                                            <select
                                                value={filterTutorId}
                                                onChange={(e) => {
                                                    setFilterTutorId(e.target.value);
                                                    loadData(selectedTable, activeTab, e.target.value);
                                                }}
                                                style={styles.select}
                                            >
                                                <option value="">Все преподаватели</option>
                                                {teachers.map(t => (
                                                    <option key={t.id} value={t.id}>{t.name || t.email} ({t.id.slice(-4)})</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                </div>
                                <div style={styles.headerActions}>
                                    {selectedTable.toLowerCase() === 'user' && (
                                        <div style={styles.roleTabs}>
                                            <button
                                                onClick={() => setRoleFilter('all')}
                                                style={roleFilter === 'all' ? styles.miniTabActive : styles.miniTab}
                                            >
                                                Все
                                            </button>
                                            <button
                                                onClick={() => setRoleFilter('teacher')}
                                                style={roleFilter === 'teacher' ? styles.miniTabActive : styles.miniTab}
                                            >
                                                Преподаватели
                                            </button>
                                            <button
                                                onClick={() => setRoleFilter('student')}
                                                style={roleFilter === 'student' ? styles.miniTabActive : styles.miniTab}
                                            >
                                                Ученики
                                            </button>
                                        </div>
                                    )}
                                    <button onClick={() => loadData(selectedTable, activeTab)} style={styles.buttonPrimary}>
                                        Обновить
                                    </button>
                                </div>
                            </div>

                            {error && <div style={styles.error}>Ошибка: {error}</div>}

                            <div style={styles.card}>
                                <details style={styles.details}>
                                    <summary style={styles.summary}>+ Добавить запись</summary>
                                    <form onSubmit={handleAdd} style={styles.addForm}>
                                        <div style={styles.formGrid}>
                                            {data.length > 0 ? Object.keys(data[0]).filter(k => !['id', 'createdAt', 'updatedAt'].includes(k)).map(key => (
                                                <div key={key} style={styles.formGroup}>
                                                    <label style={styles.label}>{key}</label>
                                                    <input name={key} placeholder={key} style={styles.inputSmall} />
                                                </div>
                                            )) : (
                                                <div style={styles.formGroup}>
                                                    <label style={styles.label}>Name</label>
                                                    <input name="name" placeholder="Name" style={styles.inputSmall} />
                                                </div>
                                            )}
                                        </div>
                                        <button type="submit" style={styles.buttonPrimary}>Сохранить</button>
                                    </form>
                                </details>

                                <div style={styles.tableWrapper}>
                                    {loading ? (
                                        <div style={styles.loading}>Загрузка данных...</div>
                                    ) : (
                                        <table style={styles.table}>
                                            <thead>
                                                <tr>
                                                    {data.length > 0 && Object.keys(data[0]).map(key => (
                                                        <th key={key} style={styles.th}>{key}</th>
                                                    ))}
                                                    <th style={styles.th}>Действия</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredData.map((row, i) => (
                                                    <tr key={row.id || i} style={styles.tr}>
                                                        {Object.entries(row).map(([key, value]) => (
                                                            <td key={key} style={styles.td}>
                                                                <input
                                                                    defaultValue={String(value ?? '')}
                                                                    disabled={selectedTable.toLowerCase() === 'user' && key === 'plan' && row.role === 'student'}
                                                                    onBlur={(e) => {
                                                                        if (e.target.value !== String(value ?? '')) {
                                                                            handleUpdate(row.id, key, e.target.value);
                                                                        }
                                                                    }}
                                                                    style={{
                                                                        ...styles.cellInput,
                                                                        opacity: (selectedTable.toLowerCase() === 'user' && key === 'plan' && row.role === 'student') ? 0.5 : 1,
                                                                        backgroundColor: (selectedTable.toLowerCase() === 'user' && key === 'plan' && row.role === 'student') ? '#eee' : 'transparent'
                                                                    }}
                                                                />
                                                            </td>
                                                        ))}
                                                        <td style={styles.td}>
                                                            <button
                                                                onClick={() => handleDelete(row.id)}
                                                                style={styles.deleteBtn}
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

const styles: Record<string, React.CSSProperties> = {
    page: {
        backgroundColor: '#f8f9fa',
        minHeight: '100vh',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        color: '#212529',
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1rem 2rem',
        backgroundColor: '#fff',
        borderBottom: '1px solid #dee2e6',
        position: 'sticky',
        top: 0,
        zIndex: 100,
    },
    title: {
        margin: 0,
        fontSize: '1.5rem',
        fontWeight: 700,
        color: '#4A6CF7',
    },
    main: {
        display: 'flex',
        flexWrap: 'wrap',
        padding: '2rem',
        gap: '2rem',
    },
    sidebar: {
        flex: '1 1 250px',
        maxWidth: '300px',
        display: 'flex',
        flexDirection: 'column',
        gap: '2rem',
    },
    content: {
        flex: '1 1 600px',
        minWidth: 0, // important for table overflow
    },
    section: {
        backgroundColor: '#fff',
        padding: '1.5rem',
        borderRadius: '12px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    },
    sectionTitle: {
        marginTop: 0,
        marginBottom: '1rem',
        fontSize: '0.9rem',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        color: '#6c757d',
    },
    dbTabs: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
    },
    tab: {
        padding: '0.75rem',
        border: '1px solid #dee2e6',
        borderRadius: '8px',
        backgroundColor: '#fff',
        color: '#212529', // Explicitly dark text
        cursor: 'pointer',
        textAlign: 'left',
        fontSize: '0.9rem',
        transition: 'all 0.2s',
    },
    tabActive: {
        padding: '0.75rem',
        border: '1px solid #4A6CF7',
        borderRadius: '8px',
        backgroundColor: '#4A6CF7',
        color: '#ffffff', // White text on dark blue
        cursor: 'pointer',
        textAlign: 'left',
        fontSize: '0.9rem',
        fontWeight: 600,
    },
    select: {
        padding: '0.4rem 0.8rem',
        borderRadius: '6px',
        border: '1px solid #dee2e6',
        fontSize: '0.85rem',
        backgroundColor: '#ffffff',
        color: '#212529',
    },
    tableList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.25rem',
        maxHeight: '400px',
        overflowY: 'auto',
    },
    tableItem: {
        padding: '0.5rem 0.75rem',
        border: 'none',
        borderRadius: '6px',
        backgroundColor: 'transparent',
        cursor: 'pointer',
        textAlign: 'left',
        fontSize: '0.9rem',
        color: '#495057',
        transition: 'all 0.2s',
    },
    tableItemActive: {
        padding: '0.5rem 0.75rem',
        border: 'none',
        borderRadius: '6px',
        backgroundColor: '#e9ecef',
        cursor: 'pointer',
        textAlign: 'left',
        fontSize: '0.9rem',
        fontWeight: 600,
        color: '#4A6CF7',
    },
    tableHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem',
        flexWrap: 'wrap',
        gap: '1rem',
    },
    headerActions: {
        display: 'flex',
        gap: '1rem',
        alignItems: 'center',
        flexWrap: 'wrap',
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
        overflow: 'hidden',
    },
    tableWrapper: {
        overflowX: 'auto',
        maxWidth: '100%',
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: '0.85rem',
    },
    th: {
        backgroundColor: '#f8f9fa',
        padding: '1rem',
        textAlign: 'left',
        borderBottom: '2px solid #dee2e6',
        fontWeight: 600,
        color: '#6c757d',
        whiteSpace: 'nowrap',
        minWidth: '150px',
    },
    td: {
        padding: '0.75rem 1rem',
        borderBottom: '1px solid #eee',
        minWidth: '150px',
    },
    tr: {
        transition: 'background 0.2s',
    },
    cellInput: {
        border: '1px solid transparent',
        width: '100%',
        padding: '4px 8px',
        borderRadius: '4px',
        backgroundColor: 'transparent',
        fontSize: 'inherit',
        color: '#212529', // Dark text for cells
    },
    deleteBtn: {
        color: '#dc3545',
        background: 'none',
        border: '1px solid #dc3545',
        borderRadius: '4px',
        padding: '4px 8px',
        cursor: 'pointer',
        fontSize: '0.8rem',
    },
    buttonPrimary: {
        backgroundColor: '#4A6CF7',
        color: '#fff',
        border: 'none',
        padding: '0.6rem 1.2rem',
        borderRadius: '8px',
        cursor: 'pointer',
        fontWeight: 600,
        fontSize: '0.9rem',
    },
    buttonSecondary: {
        backgroundColor: 'transparent',
        color: '#6c757d',
        border: '1px solid #dee2e6',
        padding: '0.5rem 1rem',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '0.9rem',
    },
    details: {
        padding: '1.5rem',
        borderBottom: '1px solid #eee',
    },
    summary: {
        fontWeight: 600,
        cursor: 'pointer',
        color: '#4A6CF7',
        userSelect: 'none',
    },
    addForm: {
        marginTop: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
    },
    formGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: '1rem',
    },
    formGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.25rem',
    },
    label: {
        fontSize: '0.75rem',
        fontWeight: 600,
        color: '#6c757d',
    },
    inputSmall: {
        padding: '0.5rem',
        border: '1px solid #dee2e6',
        borderRadius: '6px',
        fontSize: '0.9rem',
        color: '#212529',
        backgroundColor: '#ffffff',
    },
    input: {
        padding: '0.75rem',
        border: '1px solid #dee2e6',
        borderRadius: '8px',
        fontSize: '1rem',
        width: '100%',
        marginBottom: '1rem',
        color: '#212529',
        backgroundColor: '#ffffff',
    },
    loginContainer: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#f8f9fa',
    },
    loginCard: {
        backgroundColor: '#fff',
        padding: '2.5rem',
        borderRadius: '16px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
        width: '100%',
        maxWidth: '400px',
        textAlign: 'center',
    },
    loginForm: {
        marginTop: '2rem',
        display: 'flex',
        flexDirection: 'column',
    },
    error: {
        color: '#dc3545',
        backgroundColor: '#f8d7da',
        padding: '1rem',
        borderRadius: '8px',
        marginBottom: '1.5rem',
        border: '1px solid #f5c6cb',
    },
    loading: {
        padding: '2rem',
        textAlign: 'center',
        color: '#6c757d',
    },
    emptyState: {
        padding: '4rem',
        textAlign: 'center',
        color: '#6c757d',
        backgroundColor: '#fff',
        borderRadius: '12px',
        border: '2px dashed #dee2e6',
    },
    roleTabs: {
        display: 'flex',
        backgroundColor: '#e9ecef',
        padding: '4px',
        borderRadius: '8px',
        gap: '4px',
    },
    miniTab: {
        border: 'none',
        background: 'transparent',
        padding: '6px 12px',
        borderRadius: '6px',
        fontSize: '0.8rem',
        cursor: 'pointer',
        color: '#495057',
    },
    miniTabActive: {
        border: 'none',
        background: '#fff',
        padding: '6px 12px',
        borderRadius: '6px',
        fontSize: '0.8rem',
        cursor: 'pointer',
        color: '#4A6CF7',
        fontWeight: 600,
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    },
};
