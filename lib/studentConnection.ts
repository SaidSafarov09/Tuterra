import { prisma } from './prisma';
import { formatPhoneNumber } from './validation';

/**
 * Normalizes a contact string (email or phone) for comparison.
 * For phones: returns digits-only version starting with 7 (e.g., 79091234567)
 * For emails: returns lowercase trimmed email
 */
export function normalizeContact(contact: string | null | undefined): string | null {
    if (!contact) return null;
    const trimmed = contact.trim();
    if (trimmed.includes('@')) {
        return trimmed.toLowerCase();
    }

    // Handle phone
    const digits = trimmed.replace(/\D/g, '');
    if (digits.length === 0) return null;

    if (digits.length === 11 && (digits.startsWith('7') || digits.startsWith('8'))) {
        return '7' + digits.substring(1);
    }

    if (digits.length === 10) {
        return '7' + digits;
    }

    return digits;
}

/**
 * Links a User (student) to a Student record owned by a teacher (referral code).
 * If a Student record with matching contact already exists, it links it.
 * Otherwise, it creates a new Student record.
 */
export async function linkStudentToTutor(userId: string, refCode: string) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { authProviders: true }
    });

    if (!user) return null;

    const teacher = await prisma.user.findUnique({
        where: { referralCode: refCode.toUpperCase() }
    });

    if (!teacher) return null;

    // Don't link if already connected to THIS teacher
    const existingConnection = await prisma.student.findFirst({
        where: {
            ownerId: teacher.id,
            linkedUserId: user.id
        }
    });

    if (existingConnection) return existingConnection;

    // Normalize user's contacts
    const normalizedEmail = normalizeContact(user.email);
    const normalizedPhone = normalizeContact(user.phone);

    // We need to find if there's an existing Student record under this teacher that matches the user
    // We search all students of this teacher and manually check normalized contacts
    const teacherStudents = await prisma.student.findMany({
        where: {
            ownerId: teacher.id,
            linkedUserId: null // only orphaned records
        }
    });

    let studentRecord = teacherStudents.find(s => {
        const normalizedSContact = normalizeContact(s.contact);
        if (!normalizedSContact) return false;

        return normalizedSContact === normalizedEmail || normalizedSContact === normalizedPhone;
    });

    if (studentRecord) {
        // Link existing record
        return await prisma.student.update({
            where: { id: studentRecord.id },
            data: {
                linkedUserId: user.id,
                // Only update name if it was generic
                name: (studentRecord.name === 'Новый ученик' || studentRecord.name === 'test' || !studentRecord.name)
                    ? (user.name || studentRecord.name)
                    : studentRecord.name
            }
        });
    } else {
        // Create new record
        return await prisma.student.create({
            data: {
                name: user.name || user.email?.split('@')[0] || 'Новый ученик',
                ownerId: teacher.id,
                linkedUserId: user.id,
                contact: user.email || user.phone || '',
                contactType: user.email ? 'email' : 'phone'
            }
        });
    }
}
