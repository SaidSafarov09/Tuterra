import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
    const { password } = await request.json();
    const expectedPassword = process.env.ADMIN_PASSWORD;

    if (expectedPassword && password === expectedPassword) {
        const cookieStore = await cookies();
        cookieStore.set('admin_auth', password, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 * 7, // 1 week
        });
        return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'Invalid password' }, { status: 401 });
}

export async function DELETE() {
    const cookieStore = await cookies();
    cookieStore.delete('admin_auth');
    return NextResponse.json({ success: true });
}
