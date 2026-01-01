import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
    if (!(await checkAdminAuth())) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Extract model names from the Prisma client
    const models = Object.keys(prisma).filter(key =>
        typeof (prisma as any)[key] === 'object' &&
        (prisma as any)[key] !== null &&
        !(key.startsWith('_') || key.startsWith('$'))
    );

    return NextResponse.json({ models });
}
