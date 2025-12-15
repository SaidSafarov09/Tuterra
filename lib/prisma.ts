import { PrismaClient } from '@prisma/client'

type ExtendedPrismaClient = PrismaClient & {
    verificationSession: any;
    authProvider: any;
}

declare global {
    var prisma: ExtendedPrismaClient | undefined
}

const client = global.prisma || new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
}) as ExtendedPrismaClient

if (process.env.NODE_ENV !== 'production') {
    global.prisma = client
}

export const prisma = client
