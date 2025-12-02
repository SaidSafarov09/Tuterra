import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { z } from 'zod';

const registerSchema = z.object({
    name: z.string().min(2, 'Имя должно содержать минимум 2 символа'),
    email: z.string().email('Некорректный email'),
    password: z.string().min(6, 'Пароль должен содержать минимум 6 символов'),
});

export async function POST(request: Request) {
    try {
        const body = await request.json();

        const validatedData = registerSchema.parse(body);

        const existingUser = await prisma.user.findUnique({
            where: { email: validatedData.email },
        });

        if (existingUser) {
            return NextResponse.json(
                { error: 'Пользователь с таким email уже существует' },
                { status: 400 }
            );
        }

        const hashedPassword = await bcrypt.hash(validatedData.password, 10);

        const user = await prisma.user.create({
            data: {
                name: validatedData.name,
                email: validatedData.email,
                hashedPassword,
            },
        });

        return NextResponse.json(
            {
                user: { id: user?.id, name: user.name, email: user.email },
            },
            { status: 201 }
        );
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
        }
        console.error('Registration error:', error);
        return NextResponse.json(
            { error: 'Произошла ошибка при регистрации' },
            { status: 500 }
        );
    }
}
