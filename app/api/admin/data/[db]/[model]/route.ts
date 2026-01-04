import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/admin-auth';
import { getPrismaClient } from '@/lib/admin-prisma';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ db: string; model: string }> }
) {
    if (!(await checkAdminAuth())) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { db, model } = await params;
    const { searchParams } = new URL(request.url);
    const userIdFilter = searchParams.get('userId');
    const client = getPrismaClient(db as 'sqlite' | 'postgres');

    try {
        const modelClient = (client as any)[model];
        if (!modelClient) {
            return NextResponse.json({ error: 'Model not found' }, { status: 404 });
        }

        // Determine which field to filter by if userIdFilter is provided
        const where: any = {};
        if (userIdFilter) {
            const m = model.toLowerCase();
            // Specific mapping for known models to avoid "Unknown argument" errors
            if (m === 'user') {
                where.id = userIdFilter;
            } else if (['subject', 'notificationsettings', 'notification', 'lessonseries', 'verificationcode', 'authprovider', 'emailotp'].includes(m)) {
                where.userId = userIdFilter;
            } else if (['student', 'group', 'learningplan', 'lesson'].includes(m)) {
                where.ownerId = userIdFilter;
            } else if (['lessonpayment', 'lessonrequest'].includes(m)) {
                where.lesson = { ownerId: userIdFilter };
            } else {
                where.id = userIdFilter;
            }
        }

        const noCreatedAtModels = ['lessonpayment', 'notificationsettings'];
        const shouldSort = !noCreatedAtModels.includes(model.toLowerCase());

        const data = await modelClient.findMany({
            where: Object.keys(where).length > 0 ? where : undefined,
            orderBy: shouldSort ? { createdAt: 'desc' } : undefined,
            take: 200,
        });

        return NextResponse.json({ data });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ db: string; model: string }> }
) {
    if (!(await checkAdminAuth())) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { db, model } = await params;
    const body = await request.json();
    const client = getPrismaClient(db as 'sqlite' | 'postgres');

    try {
        const modelClient = (client as any)[model];
        const item = await modelClient.create({ data: body });
        return NextResponse.json({ item });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ db: string; model: string }> }
) {
    if (!(await checkAdminAuth())) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { db, model } = await params;
    const { id, ...data } = await request.json();
    const client = getPrismaClient(db as 'sqlite' | 'postgres');

    // Pre-process data to handle nulls and booleans from strings
    const processedData: any = {};
    for (const [key, value] of Object.entries(data)) {
        if (value === 'null') {
            processedData[key] = null;
        } else if (value === 'true') {
            processedData[key] = true;
        } else if (value === 'false') {
            processedData[key] = false;
        } else if (typeof value === 'string' && !isNaN(Number(value)) && value.trim() !== '' && (key.toLowerCase().includes('price') || key.toLowerCase().includes('duration'))) {
            // Basic numeric conversion for common fields
            processedData[key] = Number(value);
        } else {
            processedData[key] = value;
        }
    }

    try {
        const modelClient = (client as any)[model];
        const item = await modelClient.update({
            where: { id },
            data: processedData,
        });
        return NextResponse.json({ item });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ db: string; model: string }> }
) {
    if (!(await checkAdminAuth())) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { db, model } = await params;
    const { id } = await request.json();
    const client = getPrismaClient(db as 'sqlite' | 'postgres');

    try {
        const modelClient = (client as any)[model];
        await modelClient.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
