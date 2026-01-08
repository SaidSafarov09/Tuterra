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
        const body = await req.json().catch(() => ({}));
        const planId = (body.planId === 'year' ? 'year' : 'month') as 'month' | 'year';
        const promoCode = body.promoCode as string | undefined;

        // Импортируем PLANS из yookassa
        const { PLANS, SUBSCRIPTION_CONFIG } = require('@/lib/yookassa');
        const plan = PLANS[planId];

        // Получаем пользователя
        let user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, isPro: true, proExpiresAt: true, invitedByPartnerCode: true, partnerPaymentsCount: true } as any,
        }) as any;

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Если пришел промокод и у пользователя еще нет реферальной привязки (и он еще никогда не платил)
        if (promoCode && !user.invitedByPartnerCode && (!user.partnerPaymentsCount || user.partnerPaymentsCount === 0)) {
            const partner = await prisma.user.findFirst({
                where: { partnerCode: promoCode.trim().toUpperCase(), isPartner: true },
                select: { partnerCode: true }
            });

            if (partner) {
                // Привязываем пользователя к партнеру
                user = await prisma.user.update({
                    where: { id: userId },
                    data: { invitedByPartnerCode: partner.partnerCode },
                    select: { id: true, isPro: true, proExpiresAt: true, invitedByPartnerCode: true, partnerPaymentsCount: true } as any
                }) as any;
            }
        }

        // Если пользователь уже PRO и подписка не истекла
        if (user.isPro && user.proExpiresAt && new Date(user.proExpiresAt) > new Date()) {
            return NextResponse.json(
                { error: 'You already have an active PRO subscription' },
                { status: 400 }
            );
        }

        // Apply partner discount (20%) - ONLY for the first payment
        const PARTNER_DISCOUNT = 0.20;
        const hasPartnerDiscount = !!user.invitedByPartnerCode && (!user.partnerPaymentsCount || user.partnerPaymentsCount === 0);
        const finalAmount = hasPartnerDiscount
            ? Math.round(plan.price * (1 - PARTNER_DISCOUNT))
            : plan.price;

        // Создаем платеж
        const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?payment=success`;

        const payment = await createPayment({
            userId,
            amount: finalAmount,
            description: `${SUBSCRIPTION_CONFIG.description} (${plan.label})${hasPartnerDiscount ? ' - Скидка по промокоду 20%' : ''}`,
            returnUrl,
            planId,
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
