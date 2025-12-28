import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateVerificationCode } from '@/lib/sms'
import { sendOTP } from '@/lib/mail'
import bcrypt from 'bcrypt'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { email } = body

        if (!email || !email.includes('@')) {
            return NextResponse.json(
                { success: false, error: 'Неверный формат email' },
                { status: 400 }
            )
        }

        // Check throttle: last code sent less than 60 seconds ago
        const emailOTPModel = (prisma as any).emailOTP || (prisma as any).EmailOTP;

        if (!emailOTPModel) {
            throw new Error('Prisma model EmailOTP is not found on the instance');
        }

        const lastOTP = await emailOTPModel.findFirst({
            where: { email },
            orderBy: { createdAt: 'desc' },
        })

        // if (lastOTP && (Date.now() - lastOTP.createdAt.getTime() < 60000)) {
        //     const waitTime = Math.ceil((60000 - (Date.now() - lastOTP.createdAt.getTime())) / 1000)
        //     return NextResponse.json(
        //         { success: false, error: `Подождите еще ${waitTime} сек. перед повторной отправкой` },
        //         { status: 429 }
        //     )
        // }

        const code = generateVerificationCode(6)
        const codeHash = await bcrypt.hash(code, 10)
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

        const session = await emailOTPModel.create({
            data: {
                email,
                codeHash,
                expiresAt,
                attemptsLeft: 5,
            },
        })

        // Send email via Nodemailer
        const { success: mailSuccess, error: mailError } = await sendOTP(email, code);

        if (!mailSuccess) {
            console.error('[AUTH] Email sending failed:', mailError);
            return NextResponse.json({
                success: false,
                error: 'Ошибка при отправке письма. Пожалуйста, попробуйте позже.',
            }, { status: 500 })
        }

        console.log(`[AUTH] Email sent successfully to ${email}`);

        return NextResponse.json({
            success: true,
            sessionId: session.id,
        })
    } catch (error) {
        console.error('Send code error:', error)
        return NextResponse.json(
            { success: false, error: 'Произошла ошибка при отправке кода' },
            { status: 500 }
        )
    }
}
