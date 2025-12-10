import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/jwt'
import { prisma } from '@/lib/prisma'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const token = request.cookies.get('auth-token')?.value
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const payload = await verifyToken(token)
        if (!payload) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params

        const group = await prisma.group.findUnique({
            where: {
                id,
                userId: payload.userId
            },
            include: {
                students: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        contact: true,
                        contactType: true,
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

        if (!group) {
            return NextResponse.json({ error: 'Group not found' }, { status: 404 })
        }

        return NextResponse.json(group)
    } catch (error) {
        console.error('Error fetching group:', error)
        return NextResponse.json({ error: 'Failed to fetch group' }, { status: 500 })
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const token = request.cookies.get('auth-token')?.value
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const payload = await verifyToken(token)
        if (!payload) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params
        const body = await request.json()
        const { name, studentIds, subjectIds, note } = body

        const updateData: any = {}

        if (name !== undefined) {
            if (!name.trim()) {
                return NextResponse.json({ error: 'Name cannot be empty' }, { status: 400 })
            }
            updateData.name = name.trim()
        }

        if (note !== undefined) {
            updateData.note = note || null
        }

        if (studentIds !== undefined) {
            updateData.students = {
                set: studentIds.map((studentId: string) => ({ id: studentId }))
            }
        }

        if (subjectIds !== undefined) {
            updateData.subjects = {
                set: subjectIds.map((subjectId: string) => ({ id: subjectId }))
            }
        }

        const group = await prisma.group.update({
            where: {
                id,
                userId: payload.userId
            },
            data: updateData,
            include: {
                students: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        contact: true,
                        contactType: true,
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

        return NextResponse.json(group)
    } catch (error) {
        console.error('Error updating group:', error)
        return NextResponse.json({ error: 'Failed to update group' }, { status: 500 })
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const token = request.cookies.get('auth-token')?.value
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const payload = await verifyToken(token)
        if (!payload) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params

        await prisma.group.delete({
            where: {
                id,
                userId: payload.userId
            }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting group:', error)
        return NextResponse.json({ error: 'Failed to delete group' }, { status: 500 })
    }
}
