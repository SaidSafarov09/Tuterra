import { prisma } from './prisma';

/**
 * Generates a unique invitation code for a student.
 * Format: 8 characters, uppercase alphanumeric.
 */
export async function generateInvitationCode(): Promise<string> {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    let isUnique = false;

    while (!isUnique) {
        code = '';
        for (let i = 0; i < 8; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }

        const existing = await prisma.student.findUnique({
            where: { invitationCode: code }
        });

        if (!existing) {
            isUnique = true;
        }
    }

    return code;
}
