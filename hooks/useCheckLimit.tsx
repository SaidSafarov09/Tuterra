'use client'

import React, { useState } from 'react'
import { useAuthStore } from '@/store/auth'
import { FREE_LIMITS, LimitType } from '@/lib/limits'
import { UpgradeToProModal } from '@/components/pro/UpgradeToProModal'

export function useCheckLimit() {
    const { user } = useAuthStore()
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [currentLimitType, setCurrentLimitType] = useState<LimitType>('students')

    const checkLimit = (type: LimitType, currentCount: number): boolean => {
        // If user is pro, no limit
        if (user?.plan === 'pro') return true

        const limit = FREE_LIMITS[type as keyof typeof FREE_LIMITS]
        // If we have reached or exceeded the limit
        if (typeof limit === 'number' && currentCount >= limit) {
            setCurrentLimitType(type)
            setIsModalOpen(true)
            return false
        }

        return true
    }

    const checkFeature = (type: LimitType): boolean => {
        // If user is pro, no limit
        if (user?.plan === 'pro') return true

        // If specific feature is hard blocked (limit 0)
        const limit = FREE_LIMITS[type as keyof typeof FREE_LIMITS]
        if (limit === 0) {
            setCurrentLimitType(type)
            setIsModalOpen(true)
            return false
        }

        // For income block
        if (type === 'income') {
            setCurrentLimitType('income')
            setIsModalOpen(true)
            return false
        }

        return true
    }

    return {
        checkLimit,
        checkFeature,
        UpgradeModal: isModalOpen ? (
            <UpgradeToProModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                limitType={currentLimitType}
            />
        ) : null
    }
}
