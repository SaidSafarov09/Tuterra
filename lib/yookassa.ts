import { YooCheckout } from '@a2seven/yoo-checkout';


export const yookassa = new YooCheckout({
    shopId: process.env.YOOKASSA_SHOP_ID!,
    secretKey: process.env.YOOKASSA_SECRET_KEY!,
});

export const SUBSCRIPTION_CONFIG = {
    currency: 'RUB',
    description: 'Подписка Tuterra PRO',
} as const;

export const PLANS = {
    month: {
        id: 'month',
        price: 490,
        days: 30,
        label: 'Ежемесячно',
        description: '490 ₽ в месяц'
    },
    year: {
        id: 'year',
        price: 3990,
        days: 365,
        label: 'Ежегодно',
        description: 'Всего 332 ₽ в месяц',
        savings: '32%',
        oldPrice: 5880
    }
} as const;

export type PlanType = keyof typeof PLANS;

// Типы для платежей
export interface CreatePaymentParams {
    userId: string;
    amount: number;
    description: string;
    returnUrl: string;
    planId: PlanType;
}

export interface PaymentMetadata {
    userId: string;
    type: 'subscription';
    planId: PlanType;
}

/**
 * Создание платежа в ЮKassa
 */
export async function createPayment({
    userId,
    amount,
    description,
    returnUrl,
    planId,
}: CreatePaymentParams) {
    try {
        const payment = await yookassa.createPayment({
            amount: {
                value: amount.toFixed(2),
                currency: SUBSCRIPTION_CONFIG.currency,
            },
            confirmation: {
                type: 'redirect',
                return_url: returnUrl,
            },
            capture: true,
            description,
            metadata: {
                userId,
                type: 'subscription',
                planId,
            } as PaymentMetadata,
        });

        return payment;
    } catch (error) {
        console.error('Error creating payment:', error);
        throw new Error('Failed to create payment');
    }
}

/**
 * Получение информации о платеже
 */
export async function getPayment(paymentId: string) {
    try {
        const payment = await yookassa.getPayment(paymentId);
        return payment;
    } catch (error) {
        console.error('Error getting payment:', error);
        throw new Error('Failed to get payment');
    }
}
