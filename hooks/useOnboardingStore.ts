import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { ONBOARDING_STEPS } from '@/config/onboarding'

interface OnboardingState {
    isActive: boolean
    isCompleted: boolean
    currentStepIndex: number

    start: () => void
    next: () => void
    skip: () => void
    reset: () => void
}

export const useOnboardingStore = create<OnboardingState>()(
    persist(
        (set, get) => ({
            isActive: false,
            isCompleted: false,
            currentStepIndex: 0,

            start: () => {
                const { isCompleted } = get()
                if (!isCompleted) {
                    set({ isActive: true, currentStepIndex: 0 })
                }
            },

            next: () => {
                const { currentStepIndex } = get()
                const nextIndex = currentStepIndex + 1

                if (nextIndex >= ONBOARDING_STEPS.length) {
                    fetch('/api/onboarding/complete', { method: 'POST' }).catch(console.error)
                    set({ isActive: false, isCompleted: true })
                } else {
                    set({ currentStepIndex: nextIndex })
                }
            },

            skip: () => {
                fetch('/api/onboarding/complete', { method: 'POST' }).catch(console.error)
                set({ isActive: false, isCompleted: true })
            },

            reset: () => {
                set({ isActive: false, isCompleted: false, currentStepIndex: 0 })
            }
        }),
        {
            name: 'onboarding-storage', // уникальное имя для localStorage
            partialize: (state) => ({
                isCompleted: state.isCompleted,
                currentStepIndex: state.currentStepIndex,
                isActive: state.isActive
            }),
        }
    )
)
