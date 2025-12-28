import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { signToken } from '@/lib/jwt'
import { cookies } from 'next/headers'
import { createWelcomeNotifications } from '@/lib/welcomeNotifications'
import bcrypt from 'bcrypt'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { sessionId, code } = body

        if (!sessionId || !code) {
            return NextResponse.json(
                { success: false, error: 'Не указан sessionId или код' },
                { status: 400 }
            )
        }

        // Try to finding in EmailOTP first
        const emailOTPModel = (prisma as any).emailOTP || (prisma as any).EmailOTP;
        const emailSession = emailOTPModel ? await emailOTPModel.findUnique({
            where: { id: sessionId },
        }) : null;

        if (emailSession) {
            if (new Date() > emailSession.expiresAt) {
                await emailOTPModel.delete({ where: { id: sessionId } })
                return NextResponse.json(
                    { success: false, error: 'Код истек. Запросите новый код' },
                    { status: 400 }
                )
            }

            if (emailSession.attemptsLeft <= 0) {
                await emailOTPModel.delete({ where: { id: sessionId } })
                return NextResponse.json(
                    { success: false, error: 'Превышено количество попыток. Запросите новый код' },
                    { status: 400 }
                )
            }

            const isCodeValid = await bcrypt.compare(code, emailSession.codeHash)

            if (!isCodeValid) {
                await emailOTPModel.update({
                    where: { id: sessionId },
                    data: { attemptsLeft: emailSession.attemptsLeft - 1 },
                })

                return NextResponse.json(
                    {
                        success: false,
                        error: `Неверный код. Осталось попыток: ${emailSession.attemptsLeft - 1}`
                    },
                    { status: 400 }
                )
            }

            // Success!
            let user = await prisma.user.findUnique({
                where: { email: emailSession.email },
            })

            if (!user) {
                user = await prisma.user.create({
                    data: {
                        email: emailSession.email,
                        emailVerified: true,
                        firstName: 'Новый',
                        lastName: 'Пользователь',
                        name: emailSession.email.split('@')[0],
                    },
                })
                await createWelcomeNotifications(user.id)
            } else {
                user = await prisma.user.update({
                    where: { id: user.id },
                    data: { emailVerified: true },
                })
            }

            await emailOTPModel.delete({ where: { id: sessionId } })

            const token = await signToken({
                userId: user.id,
                phone: user.phone || '', // Keep compatibility with existing JWT payload interface
            })

            const isLocalhost = request.url.includes('localhost')
            const secure = !isLocalhost

            const cookieStore = await cookies()
            cookieStore.set('auth-token', token, {
                httpOnly: true,
                secure: secure,
                sameSite: 'lax',
                maxAge: 30 * 24 * 60 * 60,
                path: '/',
            })

            return NextResponse.json({
                success: true,
                token,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    avatar: user.avatar,
                    birthDate: user.birthDate,
                    region: user.region,
                },
            })
        }

        // Falls back to phone verification session (for legacy/commented out feature)
        const phoneSession = await prisma.verificationSession.findUnique({
            where: { id: sessionId },
        })

        if (!phoneSession) {
            return NextResponse.json(
                { success: false, error: 'Сессия не найдена' },
                { status: 404 }
            )
        }

        if (new Date() > phoneSession.expiresAt) {
            await prisma.verificationSession.delete({ where: { id: sessionId } })
            return NextResponse.json(
                { success: false, error: 'Код истек. Запросите новый код' },
                { status: 400 }
            )
        }

        if (phoneSession.attemptsLeft <= 0) {
            await prisma.verificationSession.delete({ where: { id: sessionId } })
            return NextResponse.json(
                { success: false, error: 'Превышено количество попыток. Запросите новый код' },
                { status: 400 }
            )
        }

        if (phoneSession.code !== code) {
            await prisma.verificationSession.update({
                where: { id: sessionId },
                data: { attemptsLeft: phoneSession.attemptsLeft - 1 },
            })

            return NextResponse.json(
                {
                    success: false,
                    error: `Неверный код. Осталось попыток: ${phoneSession.attemptsLeft - 1}`
                },
                { status: 400 }
            )
        }

        let user = await prisma.user.findUnique({
            where: { phone: phoneSession.phone },
        })

        if (!user) {
            user = await prisma.user.create({
                data: {
                    phone: phoneSession.phone,
                    phoneVerified: true,
                    firstName: 'Новый',
                    lastName: 'Пользователь',
                    name: 'Новый Пользователь',
                },
            })
            await createWelcomeNotifications(user.id)
        } else {
            user = await prisma.user.update({
                where: { id: user.id },
                data: { phoneVerified: true },
            })
        }

        await prisma.verificationSession.delete({ where: { id: sessionId } })

        const token = await signToken({
            userId: user.id,
            phone: user.phone!,
        })

        const isLocalhost = request.url.includes('localhost')
        const secure = !isLocalhost

        const cookieStore = await cookies()
        cookieStore.set('auth-token', token, {
            httpOnly: true,
            secure: secure,
            sameSite: 'lax',
            maxAge: 30 * 24 * 60 * 60,
            path: '/',
        })

        return NextResponse.json({
            success: true,
            token,
            user: {
                id: user.id,
                name: user.name,
                phone: user.phone,
                avatar: user.avatar,
                birthDate: user.birthDate,
                region: user.region,
            },
        })
    } catch (error) {
        console.error('Verify code error:', error)
        return NextResponse.json(
            { success: false, error: 'Произошла ошибка при проверке кода' },
            { status: 500 }
        )
    }
}
