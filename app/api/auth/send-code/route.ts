import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateVerificationCode } from '@/lib/sms'
import { sendOTP } from '@/lib/mail'
import bcrypt from 'bcrypt'

export async function POST(request: NextRequest) {
    try {
        const text = await request.text();
        if (!text) {
            return NextResponse.json({ success: false, error: 'Пустой запрос' }, { status: 400 });
        }
        const body = JSON.parse(text);
        const { email } = body

        if (!email || !email.includes('@')) {
            return NextResponse.json({ success: false, error: 'Неверный формат email' }, { status: 400 })
        }

        // Defensive model access
        const emailOTPModel = (prisma as any).emailOTP || (prisma as any).EmailOTP;

        if (!emailOTPModel) {
            console.error('EmailOTP model not found in Prisma');
            return NextResponse.json({ success: false, error: 'Ошибка конфигурации базы данных' }, { status: 500 })
        }

        // Деактивируем все старые коды для этого email
        try {
            await emailOTPModel.deleteMany({ where: { email } });
        } catch (e) {
            console.warn('Failed to cleanup old OTPs:', e);
        }

        const testEmails = ['test@test.ru',
            'test2@test.ru',
            'testx@test.ru',
            'testx2@test.ru',
            'testx3@test.ru',
            'testx4@test.ru',
            'demo@demo.ru',
            'admin@admin.com',
            'demo@tuterra.ru',
            'test@tuterra.ru',
            'testxy@test.ru',
        ]
        const isTestEmail = testEmails.includes(email)
        const code = isTestEmail ? '111111' : generateVerificationCode(6)
        const codeHash = await bcrypt.hash(code, 10)
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

        const session = await emailOTPModel.create({
            data: { email, codeHash, expiresAt, attemptsLeft: 5 },
        })

        // skip real mail sending for test emails
        if (isTestEmail) {
            return NextResponse.json({
                success: true,
                sessionId: session.id,
                message: 'Test login: use 111111'
            })
        }

        const { success: mailSuccess, error: mailError } = await sendOTP(email, code);

        if (!mailSuccess) {
            console.error('[AUTH] Email sending failed:', mailError);
            return NextResponse.json({
                success: false,
                error: 'Ошибка при отправке письма. Проверьте соединение с почтовым сервером.',
            }, { status: 500 })
        }

        return NextResponse.json({
            success: true,
            sessionId: session.id,
        })
    } catch (error) {
        console.error('Send code error:', error)
        return NextResponse.json({ success: false, error: 'Произошла непредвиденная ошибка' }, { status: 500 })
    }
}
