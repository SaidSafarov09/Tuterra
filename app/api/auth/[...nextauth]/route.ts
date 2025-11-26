import NextAuth, { AuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcrypt'

export const authOptions: AuthOptions = {
    providers: [
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error('Введите email и пароль')
                }

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email },
                })

                if (!user || !user.hashedPassword) {
                    throw new Error('Неверный email или пароль')
                }

                const isValidPassword = await bcrypt.compare(credentials.password, user.hashedPassword)
                if (!isValidPassword) {
                    throw new Error('Неверный email или пароль')
                }

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    image: user.avatar || undefined,
                }
            },
        }),
    ],
    session: { strategy: 'jwt' },
    pages: { signIn: '/login' },
    callbacks: {
        async jwt({ token, user, trigger, session }) {
            if (user) {
                token.id = user.id
                token.picture = user.image
            }

            // Обработка обновления сессии
            if (trigger === "update" && session?.user) {
                token.name = session.user.name
                token.picture = session.user.image
            }

            return token
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string
                session.user.image = token.picture
                session.user.name = token.name
            }
            return session
        },
    },
    secret: process.env.NEXTAUTH_SECRET,
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }