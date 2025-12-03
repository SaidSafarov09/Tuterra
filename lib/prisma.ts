import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

// Extend the PrismaClient type to avoid TS errors with new models
// while the editor catches up with the generated client
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
