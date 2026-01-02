import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SUBSCRIPTION_CONFIG } from '@/lib/yookassa';
import { PaymentMetadata } from '@/lib/yookassa';

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

        console.log('--- Incoming Webhook ---', logEntry);
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

        // Обновляем до PRO
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + (SUBSCRIPTION_CONFIG.durationDays || 30));

        await prisma.user.update({
            where: { id: userId },
            data: {
                isPro: true,
                proActivatedAt: new Date(),
                proExpiresAt: expiresAt,
                lastPaymentId: paymentId,
                plan: 'pro',
            },
        });

        console.log(`✅ AUTO-ACTIVATED PRO for ${user.email}`);
        webhookLogs.push({ time: timestamp, success: true, email: user.email });

        return NextResponse.json({ received: true });
    } catch (error: any) {
        console.error('❌ Webhook Critical Error:', error);
        webhookLogs.push({ time: timestamp, error: error.message });
        return NextResponse.json({ received: true });
    }
}
