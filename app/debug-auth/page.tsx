'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/auth'

export default function DebugAuthPage() {
    const { user, token, isAuthenticated } = useAuthStore()
    const [cookies, setCookies] = useState('')
    const [localStorage, setLocalStorage] = useState('')
    const [authTokenCookie, setAuthTokenCookie] = useState('')

    useEffect(() => {
        const allCookies = document.cookie
        setCookies(allCookies)

        // Try to find auth-token cookie
        const authToken = allCookies.split('; ').find(row => row.startsWith('auth-token='))
        setAuthTokenCookie(authToken || 'NOT FOUND')

        setLocalStorage(window.localStorage.getItem('auth-token') || 'NOT FOUND')
    }, [])

    return (
        <div style={{ padding: '20px', fontFamily: 'monospace', maxWidth: '800px' }}>
            <h1>🐛 Debug Auth</h1>

            <h2>Zustand Store:</h2>
            <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '5px' }}>
                {JSON.stringify({ user, token: token ? 'exists' : 'null', isAuthenticated }, null, 2)}
            </pre>

            <h2>Auth Token Cookie:</h2>
            <pre style={{ background: authTokenCookie.includes('NOT FOUND') ? '#ffe6e6' : '#e6ffe6', padding: '10px', borderRadius: '5px' }}>
                {authTokenCookie}
            </pre>

            <h2>All Cookies:</h2>
            <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '5px' }}>
                {cookies || 'No cookies'}
            </pre>

            <h2>LocalStorage auth-token:</h2>
            <pre style={{ background: localStorage.includes('NOT FOUND') ? '#ffe6e6' : '#e6ffe6', padding: '10px', borderRadius: '5px' }}>
                {localStorage}
            </pre>

            <h2>Actions:</h2>
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                    onClick={() => window.location.href = '/dashboard'}
                    style={{ padding: '10px 20px', cursor: 'pointer' }}
                >
                    Go to Dashboard
                </button>
                <button
                    onClick={() => window.location.href = '/auth'}
                    style={{ padding: '10px 20px', cursor: 'pointer' }}
                >
                    Go to Auth
                </button>
                <button
                    onClick={() => window.location.reload()}
                    style={{ padding: '10px 20px', cursor: 'pointer' }}
                >
                    Reload Page
                </button>
            </div>
        </div>
    )
}
