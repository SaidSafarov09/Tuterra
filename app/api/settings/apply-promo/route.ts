import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
    try {
        const payload = await verifyAuth(req);
        if (!payload) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = payload.userId as string;
        const { code } = await req.json();
        const upperCode = code?.toUpperCase().trim();

        if (!upperCode) {
            return NextResponse.json({ error: 'Code is required' }, { status: 400 });
        }

        // 1. Validate partner code existence first (case-insensitive check)
        const partner = await prisma.user.findFirst({
            where: {
                OR: [
                    { partnerCode: upperCode },
                    { partnerCode: code.trim() },
                    { partnerCode: code.trim().toLowerCase() }
                ],
                isPartner: true
            },
            select: { id: true, partnerCode: true }
        });

        if (!partner) {
            console.log('Partner not found for code:', { original: code, upper: upperCode });
            return NextResponse.json({ error: 'Промокод не найден' }, { status: 404 });
        }

        if (partner.id === userId) {
            return NextResponse.json({ error: 'Вы не можете использовать собственный промокод' }, { status: 400 });
        }



        // 2. Get current user status to check restrictions
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { invitedByPartnerCode: true, partnerPaymentsCount: true } as any
        }) as any;

        if (user?.partnerPaymentsCount && user.partnerPaymentsCount > 0) {
            return NextResponse.json({ error: 'Вы уже использовали партнерский промокод и не можете применить новый' }, { status: 400 });
        }

        if (user?.invitedByPartnerCode) {
            if (user.invitedByPartnerCode === partner.partnerCode) {
                return NextResponse.json({ error: 'Этот промокод уже активирован' }, { status: 400 });
            }
            return NextResponse.json({ error: 'Вы уже применили партнерский промокод и не можете сменить его' }, { status: 400 });
        }


        // Apply promo code and reset counter for the new partner
        await prisma.user.update({
            where: { id: userId },
            data: {
                invitedByPartnerCode: partner.partnerCode,
                invitedByPartnerAt: new Date(),
                partnerPaymentsCount: 0 // Reset counter for the new partner
            } as any
        });

        // Use NextResponse to set cookies
        const response = NextResponse.json({ success: true, code: partner.partnerCode });

        // Set partner_ref cookie for attribution persistence
        response.cookies.set('partner_ref', String(partner.partnerCode), {
            path: '/',
            maxAge: 90 * 24 * 60 * 60, // 90 days
            sameSite: 'lax',
        });


        return response;


    } catch (error) {
        console.error('Apply promo error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
