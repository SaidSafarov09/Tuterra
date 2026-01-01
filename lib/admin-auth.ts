import { cookies } from 'next/headers';

export async function checkAdminAuth() {
    const cookieStore = await cookies();
    const adminAuth = cookieStore.get('admin_auth')?.value;
    const expectedAuth = process.env.ADMIN_PASSWORD;

    if (!expectedAuth) return false;
    return adminAuth === expectedAuth;
}
