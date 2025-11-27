import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { prisma } from '@/lib/prisma'

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
        }

        const { id } = await params

        const students = await prisma.student.findMany({
            where: {
                ownerId: session.user.id,
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
