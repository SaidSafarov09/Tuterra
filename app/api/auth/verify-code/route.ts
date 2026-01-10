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
    isPartner: true,
    isPro: true,
    proActivatedAt: true,
    proExpiresAt: true,
    bonusMonthsEarned: true,
    invitedByPartnerCode: true,
    partnerPaymentsCount: true,
    invitedByPartnerAt: true,
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
            lessons: true,
            students: true,
        },
    },
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { sessionId, code, role, referralCode: refCode } = body

        // Handle Referral Cookies
        const requestCookies = await cookies()
        const partnerRef = requestCookies.get('partner_ref')?.value || null
        const teacherRef = requestCookies.get('referral-code')?.value || null
        const studentRef = requestCookies.get('student-referral-code')?.value || null

        if (!sessionId || !code) {
            return NextResponse.json(
                { success: false, error: 'Не указан sessionId или код' },
                { status: 400 }
            )
        }

        // Try finding in EmailOTP first
        const emailOTPModel = (prisma as any).emailOTP || (prisma as any).EmailOTP;
        const emailSession = emailOTPModel ? await emailOTPModel.findUnique({
            where: { id: sessionId },
        }) : null;

        let user;
        let isStudent = role === 'student';

        if (emailSession) {
            // Email Verification Flow
            if (new Date() > emailSession.expiresAt) {
                await emailOTPModel.delete({ where: { id: sessionId } })
                return NextResponse.json({ success: false, error: 'Код истек. Запросите новый код' }, { status: 400 })
            }

            if (emailSession.attemptsLeft <= 0) {
                await emailOTPModel.delete({ where: { id: sessionId } })
                return NextResponse.json({ success: false, error: 'Превышено количество попыток. Запросите новый код' }, { status: 400 })
            }

            const isCodeValid = await bcrypt.compare(code, emailSession.codeHash)
            if (!isCodeValid) {
                await emailOTPModel.update({
                    where: { id: sessionId },
                    data: { attemptsLeft: emailSession.attemptsLeft - 1 },
                })
                return NextResponse.json({ success: false, error: `Неверный код. Осталось попыток: ${emailSession.attemptsLeft - 1}` }, { status: 400 })
            }

            user = await prisma.user.findUnique({ where: { email: emailSession.email } })

            if (!user) {
                // New User via Email
                user = await prisma.user.create({
                    data: {
                        email: emailSession.email,
                        emailVerified: true,
                        role: role || 'teacher',
                        firstName: isStudent ? 'Новый' : 'Преподаватель',
                        lastName: isStudent ? 'Ученик' : '',
                        name: emailSession.email.split('@')[0],
                        plan: (isStudent ? null : 'free') as any,
                        referralCode: !isStudent ? Math.random().toString(36).substring(2, 8).toUpperCase() : null,
                    },
                })
                await createWelcomeNotifications(user.id)
            } else {
                // Existing User via Email
                user = await prisma.user.update({
                    where: { id: user.id },
                    data: {
                        emailVerified: true,
                        referralCode: user.referralCode || (user.role === 'teacher' ? Math.random().toString(36).substring(2, 8).toUpperCase() : null)
                    },
                })
            }

            // Centralized Partner/Referral Linking for Email Flow
            const sanitizeCode = (c: any) => {
                const s = c?.toString().trim()
                if (!s || s === 'null' || s === 'undefined' || s.length < 3) return null
                return s
            }

            const finalRefCode = sanitizeCode(refCode) || sanitizeCode(teacherRef) || sanitizeCode(partnerRef) || sanitizeCode(studentRef)

            if (finalRefCode && !user.invitedById && !(user as any).invitedByPartnerCode && !((user as any).partnerPaymentsCount > 0)) {
                const partner = await prisma.user.findFirst({
                    where: {
                        OR: [
                            { partnerCode: finalRefCode.toUpperCase() },
                            { partnerCode: finalRefCode },
                            { partnerCode: finalRefCode.toLowerCase() }
                        ],
                        isPartner: true
                    }
                })

                if (partner && partner.id !== user.id) {
                    user = await prisma.user.update({
                        where: { id: user.id },
                        data: {
                            invitedByPartnerCode: partner.partnerCode,
                            invitedByPartnerAt: new Date()
                        } as any
                    })
                } else if (!partner) {
                    // Try student/teacher referral if not a partner code
                    if (isStudent) {
                        try { await linkStudentToTutor(user.id, finalRefCode) } catch (e) { }
                    } else {
                        try { await processTeacherReferral(user.id, finalRefCode) } catch (e) { }
                    }
                }
            }
            await emailOTPModel.delete({ where: { id: sessionId } })
        } else {
            // Phone Verification Flow
            const phoneSession = await prisma.verificationSession.findUnique({ where: { id: sessionId } })
            if (!phoneSession) return NextResponse.json({ success: false, error: 'Сессия не найдена' }, { status: 404 })

            if (new Date() > phoneSession.expiresAt) {
                await prisma.verificationSession.delete({ where: { id: sessionId } })
                return NextResponse.json({ success: false, error: 'Код истек' }, { status: 400 })
            }

            if (phoneSession.attemptsLeft <= 0) {
                await prisma.verificationSession.delete({ where: { id: sessionId } })
                return NextResponse.json({ success: false, error: 'Превышено кол-во попыток' }, { status: 400 })
            }

            if (phoneSession.code !== code) {
                await prisma.verificationSession.update({ where: { id: sessionId }, data: { attemptsLeft: phoneSession.attemptsLeft - 1 } })
                return NextResponse.json({ success: false, error: `Неверный код. Осталось: ${phoneSession.attemptsLeft - 1}` }, { status: 400 })
            }

            user = await prisma.user.findUnique({ where: { phone: phoneSession.phone } })

            if (!user) {
                // New User via Phone
                user = await prisma.user.create({
                    data: {
                        phone: phoneSession.phone,
                        phoneVerified: true,
                        role: role || 'teacher',
                        firstName: 'Новый',
                        lastName: isStudent ? 'Ученик' : 'Пользователь',
                        name: 'Новый Пользователь',
                        plan: (isStudent ? null : 'free') as any,
                        referralCode: !isStudent ? Math.random().toString(36).substring(2, 8).toUpperCase() : null,
                    } as any,
                })
                await createWelcomeNotifications(user.id)
            } else {
                // Existing User via Phone
                user = await prisma.user.update({
                    where: { id: user.id },
                    data: {
                        phoneVerified: true,
                        referralCode: user.referralCode || (user.role === 'teacher' ? Math.random().toString(36).substring(2, 8).toUpperCase() : null)
                    }
                })
            }

            // Centralized Partner/Referral Linking for Phone Flow
            const sanitizeCode = (c: any) => {
                const s = c?.toString().trim()
                if (!s || s === 'null' || s === 'undefined' || s.length < 3) return null
                return s
            }

            const finalRefCode = sanitizeCode(refCode) || sanitizeCode(teacherRef) || sanitizeCode(partnerRef) || sanitizeCode(studentRef)

            if (finalRefCode && !user.invitedById && !(user as any).invitedByPartnerCode && !((user as any).partnerPaymentsCount > 0)) {
                const partner = await prisma.user.findFirst({
                    where: {
                        OR: [
                            { partnerCode: finalRefCode.toUpperCase() },
                            { partnerCode: finalRefCode },
                            { partnerCode: finalRefCode.toLowerCase() }
                        ],
                        isPartner: true
                    }
                })

                if (partner && partner.id !== user.id) {
                    user = await prisma.user.update({
                        where: { id: user.id },
                        data: {
                            invitedByPartnerCode: partner.partnerCode,
                            invitedByPartnerAt: new Date()
                        } as any
                    })
                } else if (!partner) {
                    // Try student/teacher referral if not a partner code
                    if (isStudent) {
                        try { await linkStudentToTutor(user.id, finalRefCode) } catch (e) { }
                    } else {
                        try { await processTeacherReferral(user.id, finalRefCode) } catch (e) { }
                    }
                }
            }

            await prisma.verificationSession.delete({ where: { id: sessionId } })
        }

        if (!user) return NextResponse.json({ success: false, error: 'Ошибка авторизации' }, { status: 500 })

        // Post-login actions
        try { await autoLinkByContact(user.id) } catch (e) { }

        const fullUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: fullUserSelect as any
        })

        if (!fullUser) return NextResponse.json({ success: false, error: 'Ошибка получения данных' }, { status: 500 })

        // Redirect logic
        let startPage = (fullUser as any).role === 'student' ? '/student/dashboard' : '/dashboard';
        if ((fullUser as any).isPartner && (fullUser as any).role === 'teacher' && (fullUser as any)._count?.lessons === 0 && (fullUser as any)._count?.students === 0) {
            startPage = '/partner';
        }

        const token = await signToken({
            userId: (fullUser as any).id,
            phone: (fullUser as any).phone || '',
            role: (fullUser as any).role as any,
            isPartner: !!(fullUser as any).isPartner,
            startPage
        })


        const isLocalhost = request.url.includes('localhost')
        const cookieStore = await cookies()
        cookieStore.set('auth-token', token, {
            httpOnly: true,
            secure: !isLocalhost,
            sameSite: 'lax',
            maxAge: 30 * 24 * 60 * 60,
            path: '/',
        })

        return NextResponse.json({ success: true, token, user: fullUser })

    } catch (error) {
        console.error('Verify code error:', error)
        return NextResponse.json({ success: false, error: 'Ошибка при проверке кода' }, { status: 500 })
    }
}
