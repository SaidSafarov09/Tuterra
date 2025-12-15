import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }



type ExtendedPrismaClient = PrismaClient & {
    verificationSession: any;
    authProvider: any;
}

export const prisma =
    (globalForPrisma.prisma as ExtendedPrismaClient) ||
    new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    }) as ExtendedPrismaClient

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
