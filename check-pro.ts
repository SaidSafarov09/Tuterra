import { prisma } from './lib/prisma';

async function checkProUsers() {
    const proUsers = await prisma.user.findMany({
        where: { isPro: true },
        select: {
            id: true,
            email: true,
            name: true,
            proActivatedAt: true,
            proExpiresAt: true,
            lastPaymentId: true
        }
    });

    process.exit(0);
}

checkProUsers();
