import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validatePhoneNumber, generateVerificationCode, sendSMS } from '@/lib/sms'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { phone } = body

        
        if (!phone || !validatePhoneNumber(phone)) {
            return NextResponse.json(
                { success: false, error: 'Неверный формат номера телефона. Используйте формат +7XXXXXXXXXX' },
                { status: 400 }
            )
        }

        
        
        const testNumbers = ['+79990000000', '+79998887766']
        const isTestPhone = testNumbers.includes(phone)
        const code = isTestPhone ? '111111' : generateVerificationCode(6)

        
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000) 

        const session = await prisma.verificationSession.create({
            data: {
                phone,
                code,
                expiresAt,
                attemptsLeft: 5,
            },
        })

        
        if (!isTestPhone) {
            await sendSMS(phone, code)
        }

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
