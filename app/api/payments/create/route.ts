import { NextRequest, NextResponse } from 'next/server';
import { createPayment, SUBSCRIPTION_CONFIG } from '@/lib/yookassa';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
    try {
        // Проверяем авторизацию
        const payload = await verifyAuth(req);
        if (!payload) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const userId = payload.userId as string;

        // Проверяем, не является ли пользователь уже PRO
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { isPro: true, proExpiresAt: true },
        });

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // Если пользователь уже PRO и подписка не истекла
        if (user.isPro && user.proExpiresAt && user.proExpiresAt > new Date()) {
            return NextResponse.json(
                { error: 'You already have an active PRO subscription' },
                { status: 400 }
            );
        }

        // Создаем платеж
        const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?payment=success`;

        const payment = await createPayment({
            userId,
            amount: SUBSCRIPTION_CONFIG.price,
            description: SUBSCRIPTION_CONFIG.description,
            returnUrl,
        });

        // Возвращаем URL для редиректа
        return NextResponse.json({
            confirmationUrl: payment.confirmation?.confirmation_url,
            paymentId: payment.id,
        });
    } catch (error) {
        console.error('Error creating payment:', error);
        return NextResponse.json(
            { error: 'Failed to create payment' },
            { status: 500 }
        );
    }
}
