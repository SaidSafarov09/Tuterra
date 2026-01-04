import { prisma } from './lib/prisma';

async function listUsers() {
    const users = await prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { id: true, email: true, name: true }
    });
    process.exit(0);
}

listUsers();
