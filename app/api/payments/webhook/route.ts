import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SUBSCRIPTION_CONFIG } from '@/lib/yookassa';
import { PaymentMetadata } from '@/lib/yookassa';

// Хранилище обработанных платежей для идемпотентности
const processedPayments = new Set<string>();

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // Проверяем тип события
        if (body.event !== 'payment.succeeded') {
            return NextResponse.json({ received: true });
        }

        const payment = body.object;
        const paymentId = payment.id;

        // Проверка идемпотентности
        if (processedPayments.has(paymentId)) {
            console.log(`Payment ${paymentId} already processed`);
            return NextResponse.json({ received: true });
        }

        // Проверяем статус платежа
        if (payment.status !== 'succeeded') {
            console.log(`Payment ${paymentId} status is not succeeded: ${payment.status}`);
            return NextResponse.json({ received: true });
        }

        // Получаем metadata
        const metadata = payment.metadata as PaymentMetadata;

        if (!metadata || !metadata.userId || metadata.type !== 'subscription') {
            console.error('Invalid payment metadata:', metadata);
            return NextResponse.json({ received: true });
        }

        const userId = metadata.userId;

        // Проверяем, не был ли уже обработан этот платеж в БД
        const existingUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { lastPaymentId: true },
        });

        if (existingUser?.lastPaymentId === paymentId) {
            console.log(`Payment ${paymentId} already processed in database`);
            processedPayments.add(paymentId);
            return NextResponse.json({ received: true });
        }

        // Вычисляем дату истечения подписки
        const now = new Date();
        const expiresAt = new Date(now);
        expiresAt.setDate(expiresAt.getDate() + SUBSCRIPTION_CONFIG.durationDays);

        // Обновляем пользователя
        await prisma.user.update({
            where: { id: userId },
            data: {
                isPro: true,
                proActivatedAt: now,
                proExpiresAt: expiresAt,
                lastPaymentId: paymentId,
                plan: 'pro',
            },
        });

        // Добавляем в кэш обработанных платежей
        processedPayments.add(paymentId);

        console.log(`Successfully activated PRO for user ${userId}, payment ${paymentId}`);

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error('Error processing webhook:', error);
        // Возвращаем 200, чтобы ЮKassa не повторяла запрос
        return NextResponse.json({ received: true });
    }
}
