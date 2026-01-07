'use client'

import React, { useState } from 'react'
import { useAuthStore } from '@/store/auth'
import { FREE_LIMITS, LimitType } from '@/lib/limits'
import { UpgradeToProModal } from '@/components/pro/UpgradeToProModal'

export function useCheckLimit() {
    const { user } = useAuthStore()
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [currentLimitType, setCurrentLimitType] = useState<LimitType>('students')
    const [customMessage, setCustomMessage] = useState<string | null>(null)

    const checkProStatus = () => {
        if (!user) return false
        const isPro = user.plan === 'pro' || user.isPro
        if (!isPro) return false

        // Если есть дата истечения, проверяем её
        if (user.proExpiresAt) {
            return new Date(user.proExpiresAt) > new Date()
        }

        return true
    }

    const checkLimit = (type: LimitType, currentCount: number, message?: string): boolean => {
        // If user is pro and subscription not expired, no limit
        if (checkProStatus()) return true

        const limit = FREE_LIMITS[type as keyof typeof FREE_LIMITS]
        // If we have reached or exceeded the limit
        if (typeof limit === 'number' && currentCount >= limit) {
            setCurrentLimitType(type)
            setCustomMessage(message || null)
            setIsModalOpen(true)
            return false
        }

        return true
    }

    const checkFeature = (type: LimitType, message?: string): boolean => {
        // If user is pro and subscription not expired, no limit
        if (checkProStatus()) return true

        // If specific feature is hard blocked (limit 0)
        const limit = FREE_LIMITS[type as keyof typeof FREE_LIMITS]
        if (limit === 0) {
            setCurrentLimitType(type)
            setCustomMessage(message || null)
            setIsModalOpen(true)
            return false
        }

        // For income block
        if (type === 'income') {
            setCurrentLimitType('income')
            setCustomMessage(message || null)
            setIsModalOpen(true)
            return false
        }

        return true
    }

    return {
        checkLimit,
        checkFeature,
        isPro: checkProStatus(),
        UpgradeModal: isModalOpen ? (
            <UpgradeToProModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                limitType={currentLimitType}
                customMessage={customMessage}
            />
        ) : null
    }
}
