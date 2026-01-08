import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
    id: string
    firstName: string | null
    lastName: string | null
    name: string | null | undefined
    email: string | null
    phone: string | null
    avatar: string | null
    birthDate: string | null
    region: string | null
    onboardingCompleted: boolean
    showProgressBlock?: boolean
    showInsightsBlock?: boolean
    role: 'teacher' | 'student'
    plan?: 'free' | 'pro'
    isPro?: boolean
    proActivatedAt?: string | null
    proExpiresAt?: string | null
    telegramId?: string | null
    referralCode?: string | null
    bonusMonthsEarned?: number
    invitedUsers?: Array<{
        id: string
        firstName: string | null
        lastName: string | null
        avatar: string | null
        createdAt: string
        referralBonusClaimed: boolean
        _count: {
            students: number
            lessons: number
        }
    }>
    _count?: {
        invitedUsers?: number
        groups?: number
    }
    // Partner fields
    invitedByPartnerCode?: string | null
    invitedByPartnerAt?: string | null
    partnerPaymentsCount?: number
    isPartner?: boolean
    partnerCode?: string | null
    partnerBalance?: number
    commissionRate?: number | null
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

                localStorage.setItem('auth-token', token)

                set({
                    user,
                    token,
                    isAuthenticated: true,
                })
            },

            logout: async () => {
                try {

                    localStorage.removeItem('auth-token')


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
