import { prisma } from './lib/prisma';

async function listUsers() {
    const users = await prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { id: true, email: true, name: true }
    });

    console.log('--- Last 5 Users ---');
    console.log(JSON.stringify(users, null, 2));
    process.exit(0);
}

listUsers();
