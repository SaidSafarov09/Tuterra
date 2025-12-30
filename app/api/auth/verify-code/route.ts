import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { signToken } from '@/lib/jwt'
import { cookies } from 'next/headers'
import { createWelcomeNotifications } from '@/lib/welcomeNotifications'
import { linkStudentToTutor } from '@/lib/studentConnection'
import bcrypt from 'bcrypt'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { sessionId, code, role, referralCode: refCode } = body

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

            const isStudent = role === 'student'

            if (!user) {
                const defaultFirstName = isStudent ? 'Новый' : 'Преподаватель'
                const defaultLastName = isStudent ? 'Ученик' : ''
                const displayName = emailSession.email.split('@')[0]
                const capitalizedName = displayName.charAt(0).toUpperCase() + displayName.slice(1)

                user = await prisma.user.create({
                    data: {
                        email: emailSession.email,
                        emailVerified: true,
                        role: role || 'teacher',
                        firstName: defaultFirstName,
                        lastName: defaultLastName,
                        name: capitalizedName,
                    },
                })
                await createWelcomeNotifications(user.id)

                // Referral linking
                if (isStudent && refCode) {
                    try {
                        await linkStudentToTutor(user.id, refCode)
                    } catch (e) {
                        console.error('Referral linking error during signup:', e)
                    }
                }
            } else {
                // If user exists, but we have a refCode, we should still try to link
                if (role === 'student' && refCode) {
                    try {
                        await linkStudentToTutor(user.id, refCode)
                    } catch (e) {
                        console.error('Referral linking error during login:', e)
                    }
                }
                user = await prisma.user.update({
                    where: { id: user.id },
                    data: { emailVerified: true },
                })
            }

            await emailOTPModel.delete({ where: { id: sessionId } })

            const token = await signToken({
                userId: user.id,
                phone: user.phone || '',
                role: user.role,
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
                    role: user.role,
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
                    role: role || 'teacher',
                    firstName: 'Новый',
                    lastName: role === 'student' ? 'Ученик' : 'Пользователь',
                    name: 'Новый Пользователь',
                },
            })
            await createWelcomeNotifications(user.id)

            // Referral linking for phone auth
            if (role === 'student' && refCode) {
                try {
                    await linkStudentToTutor(user.id, refCode)
                } catch (e) {
                    console.error('Phone referral linking error during signup:', e)
                }
            }
        } else {
            // If user exists, but we have a refCode, we should still try to link
            if (role === 'student' && refCode) {
                try {
                    await linkStudentToTutor(user.id, refCode)
                } catch (e) {
                    console.error('Phone referral linking error during login:', e)
                }
            }
            user = await prisma.user.update({
                where: { id: user.id },
                data: { phoneVerified: true },
            })
        }

        await prisma.verificationSession.delete({ where: { id: sessionId } })

        const token = await signToken({
            userId: user.id,
            phone: user.phone!,
            role: user.role,
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
                role: user.role,
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
