import { prisma as sitePrisma } from './prisma';
// @ts-ignore
import { PrismaClient as PostgresClient } from '@prisma/client-postgres';

let postgresClient: any = null;

export function getPrismaClient(dbType: 'sqlite' | 'postgres') {
    if (dbType === 'sqlite') {
        return sitePrisma;
    } else {
        if (!postgresClient) {
            if (!process.env.DATABASE_URL) {
                throw new Error('DATABASE_URL is not defined');
            }
            postgresClient = new PostgresClient({
                datasources: { db: { url: process.env.DATABASE_URL } },
            });
        }
        return postgresClient;
    }
}
