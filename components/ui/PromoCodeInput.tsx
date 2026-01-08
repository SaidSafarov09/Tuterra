'use client';

import React, { useState } from 'react';
import { Input } from './Input';
import { Button } from './Button';
import { Check, Ticket } from 'lucide-react';
import styles from './PromoCodeInput.module.scss';
import { toast } from 'sonner';

interface PromoCodeInputProps {
    onApply: (code: string) => void;
    initialCode?: string | null;
    isApplied?: boolean;
    buttonText?: string;
    placeholder?: string;
    showIcon?: boolean;
    hideInputWhenApplied?: boolean;
}

export const PromoCodeInput: React.FC<PromoCodeInputProps> = ({
    onApply,
    initialCode = '',
    isApplied: initialIsApplied = false,
    buttonText = 'Применить',
    placeholder = 'Введите промокод',
    showIcon = true,
    hideInputWhenApplied = true
}) => {
    const [code, setCode] = useState(initialCode || '');
    const [isValidating, setIsValidating] = useState(false);
    const [isApplied, setIsApplied] = useState(initialIsApplied);

    // Sync state with props
    React.useEffect(() => {
        setIsApplied(initialIsApplied);
        if (initialIsApplied) setCode(initialCode || '');
    }, [initialIsApplied, initialCode]);

    const handleApply = async () => {
        if (!code.trim()) return;

        setIsValidating(true);
        try {
            // Let the parent handle both validation and application in one go
            if (onApply) {
                await onApply(code.trim());
            }

            if (hideInputWhenApplied) {
                setIsApplied(true);
            }
            // If we are here, it means onApply succeeded and didn't throw
            toast.success('Промокод успешно применен!');
        } catch (err: any) {
            // If the error was already toasted by the parent, we don't toast it again.
            // But we need to make sure we don't show the success toast.
        } finally {
            setIsValidating(false);
        }
    };


    const renderInput = () => (
        <div className={styles.container}>
            <div className={styles.inputWrapper}>
                {showIcon && <Ticket size={18} className={styles.ticketIcon} />}
                <Input
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder={placeholder}
                    className={styles.input}
                    disabled={isValidating}
                />
            </div>
            <Button
                type="button"
                onClick={handleApply}
                disabled={isValidating || !code.trim()}
                className={styles.applyButton}
                size="small"
            >
                {isValidating ? '...' : buttonText}
            </Button>
        </div>
    );

    if (isApplied && hideInputWhenApplied) {
        return (
            <div className={styles.appliedCode}>
                <div className={styles.appliedInfo}>
                    <Check size={16} className={styles.checkIcon} />
                    <span>Промокод <strong>{code}</strong> применен</span>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.multiPromoWrapper}>
            {isApplied && (
                <div className={styles.appliedCodeSmall}>
                    <div className={styles.appliedInfo}>
                        <Check size={14} className={styles.checkIcon} />
                        <span>Активный код: <strong>{initialCode}</strong></span>
                    </div>
                </div>
            )}
            {renderInput()}
        </div>
    );
};
