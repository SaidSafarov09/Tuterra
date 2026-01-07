import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { signToken } from '@/lib/jwt'
import { cookies } from 'next/headers'
import { createWelcomeNotifications } from '@/lib/welcomeNotifications'
import { linkStudentToTutor, autoLinkByContact } from '@/lib/studentConnection'
import { processTeacherReferral } from '@/lib/referral'
import bcrypt from 'bcrypt'

const fullUserSelect = {
    id: true,
    role: true,
    plan: true,
    firstName: true,
    lastName: true,
    name: true,
    email: true,
    phone: true,
    avatar: true,
    birthDate: true,
    currency: true,
    timezone: true,
    region: true,
    theme: true,
    onboardingCompleted: true,
    referralCode: true,
    isPro: true,
    proActivatedAt: true,
    proExpiresAt: true,
    bonusMonthsEarned: true,
    invitedUsers: {
        select: {
            id: true,
            firstName: true,
            lastName: true,
            createdAt: true,
            referralBonusClaimed: true,
            _count: {
                select: {
                    students: true,
                    lessons: true
                }
            }
        },
        orderBy: {
            createdAt: 'desc'
        }
    },
    _count: {
        select: {
            groups: true,
            invitedUsers: true,
        },
    },
}

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

        let user;
        let isStudent = role === 'student';

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

            // Success with Email!
            user = await prisma.user.findUnique({
                where: { email: emailSession.email },
            })

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
                        plan: ((role || 'teacher') === 'student' ? null : 'free') as any,
                    },
                })
                await createWelcomeNotifications(user.id)

                // Referral linking
                if (isStudent && refCode) {
                    try {
                        await linkStudentToTutor(user.id, refCode)
                    } catch (e: any) {
                        console.error('Referral linking error during signup:', e)
                    }
                } else if (!isStudent && refCode) {
                    try {
                        await processTeacherReferral(user.id, refCode)
                    } catch (e) {
                        console.error('Teacher referral linking error:', e)
                    }
                }
            } else {
                // Existing user linking
                if (isStudent && refCode) {
                    try {
                        await linkStudentToTutor(user.id, refCode)
                    } catch (e: any) {
                        console.error('Referral linking error during login:', e)
                    }
                } else if (!isStudent && refCode) {
                    try {
                        await processTeacherReferral(user.id, refCode)
                    } catch (e) {
                        console.error('Teacher referral linking error during login:', e)
                    }
                }
                user = await prisma.user.update({
                    where: { id: user.id },
                    data: { emailVerified: true },
                })
            }

            await emailOTPModel.delete({ where: { id: sessionId } })
        } else {
            // Falls back to phone verification
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

            user = await prisma.user.findUnique({
                where: { phone: phoneSession.phone },
            })

            if (!user) {
                user = await prisma.user.create({
                    data: {
                        phone: phoneSession.phone,
                        phoneVerified: true,
                        role: role || 'teacher',
                        firstName: 'Новый',
                        lastName: isStudent ? 'Ученик' : 'Пользователь',
                        name: 'Новый Пользователь',
                        plan: (isStudent ? null : 'free') as any,
                    },
                })
                await createWelcomeNotifications(user.id)

                if (isStudent && refCode) {
                    try {
                        await linkStudentToTutor(user.id, refCode)
                    } catch (e) {
                        console.error('Phone referral linking error during signup:', e)
                    }
                } else if (!isStudent && refCode) {
                    try {
                        await processTeacherReferral(user.id, refCode)
                    } catch (e) {
                        console.error('Phone teacher referral linking error signup:', e)
                    }
                }
            } else {
                if (isStudent && refCode) {
                    try {
                        await linkStudentToTutor(user.id, refCode)
                    } catch (e) {
                        console.error('Phone referral linking error during login:', e)
                    }
                } else if (!isStudent && refCode) {
                    try {
                        await processTeacherReferral(user.id, refCode)
                    } catch (e) {
                        console.error('Phone teacher referral linking error login:', e)
                    }
                }
                user = await prisma.user.update({
                    where: { id: user.id },
                    data: { phoneVerified: true },
                })
            }

            await prisma.verificationSession.delete({ where: { id: sessionId } })
        }

        if (!user) {
            return NextResponse.json({ success: false, error: 'Ошибка авторизации' }, { status: 500 })
        }

        // Auto-link any matching student records by contact info (email/phone)
        try {
            await autoLinkByContact(user.id)
        } catch (e) {
            console.error('Auto-linking error:', e)
        }

        // Refetch full user data for the frontend store
        const fullUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: fullUserSelect as any
        })

        if (!fullUser) {
            return NextResponse.json({ success: false, error: 'Ошибка получения данных' }, { status: 500 })
        }

        // Finalize session with the MOST UP TO DATE role (might have changed during auto-link)
        const token = await signToken({
            userId: (fullUser as any).id,
            phone: (fullUser as any).phone || '',
            role: (fullUser as any).role,
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
            user: fullUser,
        })

    } catch (error) {
        console.error('Verify code error:', error)
        return NextResponse.json(
            { success: false, error: 'Произошла ошибка при проверке кода' },
            { status: 500 }
        )
    }
}
