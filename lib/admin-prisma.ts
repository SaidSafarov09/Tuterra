import { prisma as sitePrisma } from './prisma';

export function getPrismaClient(dbType: 'sqlite' | 'postgres') {
    // In production, everything uses the main Postgres client
    if (process.env.NODE_ENV === 'production') {
        return sitePrisma;
    }

    if (dbType === 'sqlite') {
        return sitePrisma;
    } else {
        // In development, handle Postgres separately for the admin panel
        try {
            // We use a dynamic require here to avoid build-time errors when the module doesn't exist
            // This is only for the local admin panel dev experience
            const { PrismaClient: PostgresClient } = require('@prisma/client-postgres');

            const targetUrl = process.env.PROD_DATABASE_URL || process.env.DATABASE_URL;

            // @ts-ignore
            if (!global.adminPostgresClient || global.adminPostgresUrl !== targetUrl) {
                // @ts-ignore
                global.adminPostgresClient = new PostgresClient({
                    datasources: { db: { url: targetUrl } },
                });
                // @ts-ignore
                global.adminPostgresUrl = targetUrl;
            }
            // @ts-ignore
            return global.adminPostgresClient;
        } catch (e) {
            console.error('Postgres client not found, make sure to run: prisma generate --schema=prisma/schema.admin.prisma');
            return sitePrisma;
        }
    }
}
