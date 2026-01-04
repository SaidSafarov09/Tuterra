import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SUBSCRIPTION_CONFIG, PLANS, PaymentMetadata } from '@/lib/yookassa';

// Временное хранилище логов для отладки (в памяти)
let webhookLogs: any[] = [];

export async function GET() {
    return NextResponse.json(webhookLogs.slice(-10)); // Показываем последние 10 логов
}

export async function POST(req: NextRequest) {
    const timestamp = new Date().toISOString();
    try {
        const body = await req.json();

        const logEntry = {
            time: timestamp,
            event: body.event,
            paymentId: body.object?.id,
            status: body.object?.status,
            metadata: body.object?.metadata
        };

        webhookLogs.push(logEntry);

        if (body.event !== 'payment.succeeded') {
            return NextResponse.json({ received: true });
        }

        const payment = body.object;
        const paymentId = payment.id;
        const metadata = payment.metadata as PaymentMetadata;

        if (!metadata || !metadata.userId) {
            console.error('❌ No metadata or userId found in payment');
            webhookLogs.push({ time: timestamp, error: 'No metadata/userId', metadata });
            return NextResponse.json({ received: true });
        }

        const userId = metadata.userId;

        // Ищем пользователя
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user) {
            console.error(`❌ User with ID ${userId} not found in database!`);
            webhookLogs.push({ time: timestamp, error: 'User not found', userId });
            return NextResponse.json({ received: true });
        }

        // Обновляем подписку пользователя
        const planId = (metadata.planId as 'month' | 'year') || 'month'; // Извлекаем planId из метаданных
        const planConfig = PLANS[planId];
        const durationDays = planConfig ? planConfig.days : 30; // Используем durationDays из плана или 30 по умолчанию

        await prisma.user.update({
            where: { id: userId },
            data: {
                isPro: true,
                proActivatedAt: new Date(),
                proExpiresAt: new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000), // Вычисляем дату окончания
                lastPaymentId: paymentId,
                plan: 'pro', // Обновляем поле plan на 'pro'
            },
        });

        webhookLogs.push({ time: timestamp, success: true, email: user.email });

        return NextResponse.json({ received: true });
    } catch (error: any) {
        console.error('❌ Webhook Critical Error:', error);
        webhookLogs.push({ time: timestamp, error: error.message });
        return NextResponse.json({ received: true });
    }
}
