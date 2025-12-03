import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validatePhoneNumber, generateVerificationCode, sendSMS } from '@/lib/sms'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { phone } = body

        // Validate phone number
        if (!phone || !validatePhoneNumber(phone)) {
            return NextResponse.json(
                { success: false, error: 'Неверный формат номера телефона. Используйте формат +7XXXXXXXXXX' },
                { status: 400 }
            )
        }

        // Generate verification code
        const code = generateVerificationCode(6)

        // Create verification session
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes

        const session = await prisma.verificationSession.create({
            data: {
                phone,
                code,
                expiresAt,
                attemptsLeft: 5,
            },
        })

        // Send SMS (fake for now)
        await sendSMS(phone, code)

        return NextResponse.json({
            success: true,
            sessionId: session.id,
        })
    } catch (error) {
        console.error('Request code error:', error)
        return NextResponse.json(
            { success: false, error: 'Произошла ошибка при отправке кода' },
            { status: 500 }
        )
    }
}
