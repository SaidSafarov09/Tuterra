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
            where: { id: userId },
            select: {
                id: true,
                email: true,
                invitedByPartnerCode: true,
                partnerPaymentsCount: true
            }
        });

        if (!user) {
            console.error(`❌ User with ID ${userId} not found in database!`);
            webhookLogs.push({ time: timestamp, error: 'User not found', userId });
            return NextResponse.json({ received: true });
        }

        // Обновляем подписку пользователя
        const planId = (metadata.planId as 'month' | 'year') || 'month';
        const planConfig = PLANS[planId];
        const durationDays = planConfig ? planConfig.days : 30;

        await prisma.user.update({
            where: { id: userId },
            data: {
                isPro: true,
                proActivatedAt: new Date(),
                proExpiresAt: new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000),
                lastPaymentId: paymentId,
                plan: 'pro',
            },
        });

        // Partner commission logic
        if (user.invitedByPartnerCode) {
            try {
                const partner = await prisma.user.findFirst({
                    where: { partnerCode: user.invitedByPartnerCode },
                    select: {
                        id: true,
                        partnerBalance: true,
                        commissionRate: true,
                        commissionPaymentsLimit: true
                    }
                });

                if (partner) {
                    // Check if user hasn't exceeded commission payment limit
                    const currentPaymentCount = user.partnerPaymentsCount || 0;
                    const paymentLimit = partner.commissionPaymentsLimit || 3;

                    if (currentPaymentCount < paymentLimit) {
                        // Calculate commission from ACTUAL paid amount (with discount applied)
                        const paidAmount = parseFloat(payment.amount.value);
                        const commissionRate = partner.commissionRate || 0.20; // Default 20%
                        const commission = Math.round(paidAmount * commissionRate);

                        // Update partner balance
                        await prisma.user.update({
                            where: { id: partner.id },
                            data: {
                                partnerBalance: {
                                    increment: commission
                                }
                            }
                        });

                        // Create transaction record
                        await prisma.partnerTransaction.create({
                            data: {
                                partnerId: partner.id,
                                amount: commission,
                                type: 'commission',
                                description: `Комиссия за подписку ${planId === 'year' ? 'Год' : 'Месяц'} (платеж ${currentPaymentCount + 1}/${paymentLimit})`,
                                status: 'completed',
                                sourceUserId: userId,
                                paymentId: paymentId
                            }
                        });

                        webhookLogs.push({
                            time: timestamp,
                            partnerCommission: true,
                            partnerId: partner.id,
                            commission,
                            paidAmount,
                            paymentNumber: currentPaymentCount + 1,
                            paymentLimit
                        });
                    } else {
                        webhookLogs.push({
                            time: timestamp,
                            partnerCommissionSkipped: true,
                            reason: 'Payment limit reached',
                            currentCount: currentPaymentCount,
                            limit: paymentLimit
                        });
                    }

                    // Increment payment counter (always, even after limit)
                    await prisma.user.update({
                        where: { id: userId },
                        data: {
                            partnerPaymentsCount: {
                                increment: 1
                            }
                        }
                    });

                    // Remove invitedByPartnerCode only after reaching the limit
                    if (currentPaymentCount + 1 >= paymentLimit) {
                        await prisma.user.update({
                            where: { id: userId },
                            data: {
                                invitedByPartnerCode: null
                            }
                        });
                    }
                }

            } catch (partnerError: any) {
                console.error('Partner commission error:', partnerError);
                webhookLogs.push({ time: timestamp, partnerError: partnerError.message });
            }
        }

        webhookLogs.push({ time: timestamp, success: true, email: user.email });

        return NextResponse.json({ received: true });
    } catch (error: any) {
        console.error('❌ Webhook Critical Error:', error);
        webhookLogs.push({ time: timestamp, error: error.message });
        return NextResponse.json({ received: true });
    }
}
