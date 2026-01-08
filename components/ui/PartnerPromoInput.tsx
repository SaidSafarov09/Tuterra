'use client';

import React from 'react';
import { PromoCodeInput } from './PromoCodeInput';
import { useAuthStore } from '@/store/auth';
import { toast } from 'sonner';

interface PartnerPromoInputProps {
    onSuccess?: (code: string) => void;
    initialCode?: string | null;
    placeholder?: string;
    hideInputWhenApplied?: boolean;
}

/**
 * A managed version of PromoCodeInput that specifically handles 
 * the application of partner promo codes via the backend API.
 */
export const PartnerPromoInput: React.FC<PartnerPromoInputProps> = ({
    onSuccess,
    initialCode,
    placeholder,
    hideInputWhenApplied = false
}) => {
    const { user, setUser } = useAuthStore();

    const handleApply = async (code: string) => {
        if (!code) return;

        try {
            const res = await fetch('/api/settings/apply-promo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code })
            });

            const data = await res.json();

            if (data.success) {
                // Update the global auth state immediately
                if (user) {
                    setUser({
                        ...user,
                        invitedByPartnerCode: data.code,
                        partnerPaymentsCount: 0,
                        invitedByPartnerAt: new Date().toISOString()
                    });
                }

                // Notify parent if needed (e.g. for price recalculation)
                if (onSuccess) {
                    onSuccess(data.code);
                }
            } else {
                toast.error(data.error || 'Не удалось применить промокод');
                // Throwing the error here tells PromoCodeInput that the apply failed, 
                // preventing it from showing its own success toast.
                throw new Error(data.error);
            }
        } catch (err) {
            if (!(err instanceof Error)) {
                toast.error('Ошибка при применении промокода');
            }
            throw err;
        }
    };

    return (
        <PromoCodeInput
            onApply={handleApply}
            initialCode={initialCode}
            placeholder={placeholder}
            hideInputWhenApplied={hideInputWhenApplied}
            isApplied={false} // Managed by our parent components usually
        />
    );
};
