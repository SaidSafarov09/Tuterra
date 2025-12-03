import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

import { prisma } from '@/lib/prisma'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCurrentUser(request)
        if (!user) {
            return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
        }

        const { id } = await params

        const students = await prisma.student.findMany({
            where: {
                ownerId: user.id,
                subjects: {
                    some: {
                        id: id,
                    },
                },
            },
            include: {
                lessons: {
                    where: {
                        date: {
                            gte: new Date(),
                        },
                    },
                    orderBy: {
                        date: 'asc',
                    },
                    take: 1,
                },
            },
            orderBy: {
                name: 'asc',
            },
        })

        return NextResponse.json(students)
    } catch (error) {
        console.error('Get subject students error:', error)
        return NextResponse.json(
            { error: 'Произошла ошибка' },
            { status: 500 }
        )
    }
}
