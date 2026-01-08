import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';

export async function GET(req: NextRequest) {
    // 1. Auth check
    const token = req.cookies.get('auth-token')?.value;
    if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: payload.userId },
            select: {
                id: true,
                isPartner: true,
                partnerCode: true,
                partnerBalance: true,
                commissionRate: true,
                commissionPaymentsLimit: true,
            }
        });

        if (!user || !user.isPartner) {
            return NextResponse.json({ error: 'Not a partner' }, { status: 403 });
        }

        // 2. Fetch Transactions
        const transactions = await prisma.partnerTransaction.findMany({
            where: { partnerId: user.id },
            orderBy: { createdAt: 'desc' },
            take: 20
        });

        // 3. Stats (count total invited)
        const referralsCount = await prisma.user.count({
            where: { invitedByPartnerCode: user.partnerCode }
        });

        return NextResponse.json({
            balance: user.partnerBalance,
            code: user.partnerCode,
            commissionRate: user.commissionRate ?? 0.20,
            commissionPaymentsLimit: user.commissionPaymentsLimit ?? 3,
            referralsCount,
            transactions
        });

    } catch (error) {
        console.error('[PartnerAPI] Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
