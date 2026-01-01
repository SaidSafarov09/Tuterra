import { NextRequest, NextResponse } from "next/server";
import { findOrCreateOAuthUser, createAuthSession } from "@/lib/oauth";

interface YandexUser {
  id: string;
  login: string;
  client_id: string;
  display_name: string;
  real_name: string;
  first_name: string;
  last_name: string;
  sex: "male" | "female" | null;
  default_email: string;
  emails: string[];
  default_phone?: { id: number; number: string };
  birthday: string | null;
  default_avatar_id: string;
  is_avatar_empty: boolean;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(new URL("/auth?error=no_code", req.url));
  }

  try {
    const tokenResponse = await fetch("https://oauth.yandex.ru/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: process.env.YANDEX_CLIENT_ID!,
        client_secret: process.env.YANDEX_CLIENT_SECRET!,
      }),
    });

    const tokenData = await tokenResponse.json();
    if (!tokenData.access_token) {
      console.error("Yandex token error:", tokenData);
      return NextResponse.redirect(new URL("/auth?error=token_error", req.url));
    }
    const userResponse = await fetch(
      "https://login.yandex.ru/info?format=json",
      {
        headers: { Authorization: `OAuth ${tokenData.access_token}` },
      }
    );
    const yandexUser: YandexUser = await userResponse.json();
    const avatarUrl = yandexUser.is_avatar_empty
      ? null
      : `https://avatars.yandex.net/get-yapic/${yandexUser.default_avatar_id}/islands-200`;

    const user = await findOrCreateOAuthUser({
      email: yandexUser.default_email || null,
      phone: yandexUser.default_phone?.number || null,
      firstName: yandexUser.first_name,
      lastName: yandexUser.last_name,
      avatar: avatarUrl,
      birthDate: yandexUser.birthday ? new Date(yandexUser.birthday) : null,
      provider: "yandex",
      providerId: yandexUser.id,
    });

    // Handle referral linking
    const { cookies } = await import('next/headers')
    const cookieStore = await cookies()
    const refCode = cookieStore.get('referral-code')?.value

    if (refCode) {
      try {
        const { linkStudentToTutor } = await import('@/lib/studentConnection')
        const linked = await linkStudentToTutor(user.id, refCode)
        if (linked) {
          user.role = 'student'
        }
      } catch (e: any) {
        console.error('Referral linking error during Yandex auth:', e)
        if (e.message === 'ACCOUNT_IS_TEACHER') {
          const response = NextResponse.redirect(new URL('/auth', req.url))
          response.cookies.set('auth_error', 'account_is_teacher', { maxAge: 10, path: '/' })
          return response
        }
      }
      // Clear the referral cookie
      cookieStore.delete('referral-code')
    }

    return createAuthSession(user.id, user.phone || "", req.url, user.role);
  } catch (error) {
    console.error("Yandex auth error:", error);
    return NextResponse.redirect(new URL("/auth?error=auth_failed", req.url));
  }
}
