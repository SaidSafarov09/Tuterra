import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
    id: string
    firstName: string | null
    lastName: string | null
    name: string | null | undefined  // Оставлено для совместимости
    email: string | null
    phone: string | null
    avatar: string | null
}

interface AuthState {
    user: User | null
    token: string | null
    isAuthenticated: boolean
    login: (token: string, user: User) => void
    logout: () => Promise<void>
    setUser: (user: User) => void
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            token: null,
            isAuthenticated: false,

            login: (token: string, user: User) => {
                // Store token in localStorage as fallback
                localStorage.setItem('auth-token', token)

                set({
                    user,
                    token,
                    isAuthenticated: true,
                })
            },

            logout: async () => {
                try {
                    // Clear localStorage
                    localStorage.removeItem('auth-token')

                    // Call logout API to clear httpOnly cookie
                    await fetch('/api/auth/logout', { method: 'POST' })
                } catch (error) {
                    console.error('Logout error:', error)
                } finally {
                    set({
                        user: null,
                        token: null,
                        isAuthenticated: false,
                    })
                }
            },

            setUser: (user: User) => {
                set({ user })
            },
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({
                user: state.user,
                isAuthenticated: state.isAuthenticated,
            }),
        }
    )
)
