import { YooCheckout } from '@a2seven/yoo-checkout';


export const yookassa = new YooCheckout({
    shopId: process.env.YOOKASSA_SHOP_ID!,
    secretKey: process.env.YOOKASSA_SECRET_KEY!,
});

export const SUBSCRIPTION_CONFIG = {
    price: 1, // 490 рублей
    currency: 'RUB',
    description: 'Подписка Tuterra PRO',
    durationDays: 30, // 30 дней подписки
} as const;

// Типы для платежей
export interface CreatePaymentParams {
    userId: string;
    amount: number;
    description: string;
    returnUrl: string;
}

export interface PaymentMetadata {
    userId: string;
    type: 'subscription';
}

/**
 * Создание платежа в ЮKassa
 */
export async function createPayment({
    userId,
    amount,
    description,
    returnUrl,
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
