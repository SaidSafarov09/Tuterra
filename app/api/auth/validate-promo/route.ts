import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
        return NextResponse.json({ error: 'Code is required' }, { status: 400 });
    }

    try {
        const partner = await prisma.user.findFirst({
            where: {
                OR: [
                    { partnerCode: code.trim().toUpperCase() },
                    { partnerCode: code.trim() },
                    { partnerCode: code.trim().toLowerCase() }
                ],
                isPartner: true
            },
            select: {
                partnerCode: true,
                commissionRate: true
            }
        });

        if (partner) {
            return NextResponse.json({
                valid: true,
                code: partner.partnerCode,
                discount: 20 // Standard 20% discount for now
            });
        }

        const teacher = await prisma.user.findFirst({
            where: {
                referralCode: code.trim().toUpperCase()
            },
            select: {
                referralCode: true
            }
        });


        if (!teacher) {
            return NextResponse.json({ valid: false, error: 'Промокод не найден' });
        }

        return NextResponse.json({
            valid: true,
            code: teacher.referralCode,
            discount: 0 // Regular referrals might not have a discount on sub, just grant PRO
        });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
