import { SignJWT, jwtVerify } from 'jose'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'
const JWT_EXPIRES_IN = '30d'

export interface JWTPayload {
    userId: string
    phone: string
    role: string
    isPartner?: boolean
    startPage?: string // 'partner' | 'dashboard' | 'student'
}


const getSecretKey = () => new TextEncoder().encode(JWT_SECRET)

export async function signToken(payload: JWTPayload): Promise<string> {
    const secret = getSecretKey()
    const token = await new SignJWT(payload as any)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(JWT_EXPIRES_IN)
        .sign(secret)

    return token
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
    try {
        const secret = getSecretKey()
        const { payload } = await jwtVerify(token, secret)


        if (payload && typeof payload === 'object' && 'userId' in payload) {
            return {
                userId: payload.userId as string,
                phone: (payload.phone as string) || '',
                role: (payload.role as string) || 'teacher',
                isPartner: (payload.isPartner as boolean) || false,
                startPage: (payload.startPage as string) || undefined,
            }
        }

        return null
    } catch (error) {
        console.error('[JWT] Token verification failed:', error instanceof Error ? error.message : error)
        return null
    }
}
