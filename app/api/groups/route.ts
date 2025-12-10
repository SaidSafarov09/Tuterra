import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/jwt'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
    try {
        const token = request.cookies.get('auth-token')?.value
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const payload = await verifyToken(token)
        if (!payload) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const groups = await prisma.group.findMany({
            where: { userId: payload.userId },
            include: {
                students: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                    }
                },
                subjects: {
                    select: {
                        id: true,
                        name: true,
                        color: true,
                    }
                },
                _count: {
                    select: {
                        students: true,
                        lessons: true,
                        subjects: true,
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json(groups)
    } catch (error) {
        console.error('Error fetching groups:', error)
        return NextResponse.json({ error: 'Failed to fetch groups' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const token = request.cookies.get('auth-token')?.value
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const payload = await verifyToken(token)
        if (!payload) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { name, studentIds = [], subjectIds = [], note } = body

        if (!name || !name.trim()) {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 })
        }

        const group = await prisma.group.create({
            data: {
                name: name.trim(),
                note: note || null,
                userId: payload.userId,
                students: {
                    connect: studentIds.map((id: string) => ({ id }))
                },
                subjects: {
                    connect: subjectIds.map((id: string) => ({ id }))
                }
            },
            include: {
                students: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                    }
                },
                subjects: {
                    select: {
                        id: true,
                        name: true,
                        color: true,
                    }
                },
                _count: {
                    select: {
                        students: true,
                        lessons: true,
                        subjects: true,
                    }
                }
            }
        })

        return NextResponse.json(group, { status: 201 })
    } catch (error) {
        console.error('Error creating group:', error)
        return NextResponse.json({ error: 'Failed to create group' }, { status: 500 })
    }
}
