'use client'

import React, { useEffect, useState } from 'react'
import { notificationsApi } from '@/services/api'
import { ReferralBonusModal } from './ReferralBonusModal'

export const ReferralBonusManager: React.FC = () => {
    const [pendingBonus, setPendingBonus] = useState<{
        id: string;
        inviteeName: string;
    } | null>(null)

    const checkNotifications = async () => {
        try {
            const notifications = await notificationsApi.getAll()
            // Look for unread referral_bonus_earned notifications
            const bonusNotif = notifications.find(n =>
                n.type === 'referral_bonus_earned' && !n.isRead
            )

            if (bonusNotif) {
                let inviteeName = 'Ваш друг'
                try {
                    if (bonusNotif.data) {
                        const data = JSON.parse(bonusNotif.data)
                        inviteeName = data.inviteeName || inviteeName
                    }
                } catch (e) {
                    // Fallback to default name if JSON parse fails
                }

                setPendingBonus({
                    id: bonusNotif.id,
                    inviteeName
                })
            }
        } catch (error) {
            console.error('Failed to check for referral bonuses:', error)
        }
    }

    useEffect(() => {
        // Check on mount
        checkNotifications()

        // Poll every 2 minutes for new bonuses
        const interval = setInterval(checkNotifications, 120000)
        return () => clearInterval(interval)
    }, [])

    if (!pendingBonus) return null

    return (
        <ReferralBonusModal
            notificationId={pendingBonus.id}
            inviteeName={pendingBonus.inviteeName}
            onClose={() => setPendingBonus(null)}
        />
    )
}
