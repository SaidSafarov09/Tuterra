import { prisma } from './prisma';
import { FREE_LIMITS } from './limits';

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

async function checkLimits(teacherId: string, isCreatingNew: boolean) {
    const teacher = await prisma.user.findUnique({
        where: { id: teacherId },
        select: { plan: true }
    })

    if (teacher && teacher.plan !== 'pro') {
        const connectedCount = await prisma.student.count({
            where: { ownerId: teacherId, linkedUserId: { not: null } }
        })

        if (connectedCount >= FREE_LIMITS.connectedStudents) {
            throw new Error('У преподавателя достигнут лимит подключенных учеников (Free: 1)')
        }

        if (isCreatingNew) {
            const studentCount = await prisma.student.count({
                where: { ownerId: teacherId }
            })

            if (studentCount >= FREE_LIMITS.students) {
                throw new Error('У преподавателя достигнут лимит учеников (Free: 5)')
            }
        }
    }
}

/**
 * Links a User (student) to a Student record.
 * Prioritizes linking by specific student invitationCode.
 * Fallbacks to linking by teacher referralCode (using contact matching).
 */
export async function linkStudentToTutor(userId: string, code: string) {
    const user = await prisma.user.findUnique({
        where: { id: userId }
    });

    if (!user) return null;

    const normalizedCode = code.trim().toUpperCase();

    // 1. Try to find a Student record with this invitationCode
    let studentByCode = await prisma.student.findUnique({
        where: { invitationCode: normalizedCode }
    });

    if (studentByCode) {
        // If already linked, check if it's the same user
        if (studentByCode.linkedUserId) {
            if (studentByCode.linkedUserId === userId) return studentByCode;
            return null;
        }

        // Check if this user is ALREADY connected to THIS teacher via another record
        const existingConnectionUnderSameTeacher = await prisma.student.findFirst({
            where: {
                ownerId: studentByCode.ownerId,
                linkedUserId: userId
            }
        });

        if (existingConnectionUnderSameTeacher) {
            // If the user is already connected to this teacher via this exact record, it's fine (no-op)
            if (existingConnectionUnderSameTeacher.id === studentByCode.id) return existingConnectionUnderSameTeacher;

            // Otherwise, they are already connected via a DIFFERENT record. Prevent taking another one.
            throw new Error('Вы уже подключены к этому преподавателю');
        }

        // Check Limits (linking existing)
        await checkLimits(studentByCode.ownerId, false)

        // Link it!
        return await prisma.student.update({
            where: { id: studentByCode.id },
            data: {
                linkedUserId: user.id
            }
        });
    }

    // 2. Fallback: try to find a Teacher by referralCode
    const teacher = await prisma.user.findUnique({
        where: { referralCode: normalizedCode }
    });

    if (!teacher) return null;

    // Check if already connected to THIS teacher
    const existingConnection = await prisma.student.findFirst({
        where: {
            ownerId: teacher.id,
            linkedUserId: user.id
        }
    });

    if (existingConnection) {
        throw new Error('Вы уже подключены к этому преподавателю');
    }

    const normalizedEmail = normalizeContact(user.email);
    const normalizedPhone = normalizeContact(user.phone);

    // Find matching orphaned record
    const teacherStudents = await prisma.student.findMany({
        where: {
            ownerId: teacher.id,
            linkedUserId: null
        }
    });

    let studentRecord = teacherStudents.find(s => {
        const normalizedSContact = normalizeContact(s.contact);
        if (!normalizedSContact) return false;
        return normalizedSContact === normalizedEmail || normalizedSContact === normalizedPhone;
    });

    if (studentRecord) {
        // Check Limits (linking existing)
        await checkLimits(teacher.id, false)

        return await prisma.student.update({
            where: { id: studentRecord.id },
            data: {
                linkedUserId: user.id
            }
        });
    } else {
        // Create new record for this teacher
        // Check Limits (creating new + linking)
        await checkLimits(teacher.id, true)

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
