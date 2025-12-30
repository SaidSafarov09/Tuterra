import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { startOfMonth, endOfMonth } from 'date-fns'

export async function GET(request: NextRequest) {
    try {
        const user = await getCurrentUser(request)

        if (!user) {
            return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const filter = searchParams.get('filter')

        let whereClause: any = {
            ownerId: user.id,
            OR: [
                { isPaid: true },
                { lessonPayments: { some: { hasPaid: true } } }
            ]
        }

        if (filter && filter !== 'all') {
            const [year, month] = filter.split('-').map(Number)
            const date = new Date(year, month - 1, 1)
            whereClause.date = {
                gte: startOfMonth(date),
                lte: endOfMonth(date)
            }
        }

        const transactions = await prisma.lesson.findMany({
            where: whereClause,
            orderBy: { date: 'desc' },
            include: {
                student: {
                    select: {
                        name: true,
                        linkedUser: {
                            select: {
                                avatar: true
                            }
                        }
                    }
                },
                subject: { select: { name: true, color: true, icon: true } },
                group: { select: { name: true } },
                lessonPayments: {
                    include: {
                        student: {
                            select: {
                                name: true,
                                linkedUser: {
                                    select: {
                                        avatar: true
                                    }
                                }
                            }
                        }
                    }
                },
            },
        })

        const processedTransactions = transactions.map(tx => {
            if (tx.group && tx.lessonPayments && tx.lessonPayments.length > 0) {
                const paidAmount = tx.lessonPayments.filter(p => p.hasPaid).length * tx.price
                return { ...tx, price: paidAmount }
            }
            return tx
        })

        return NextResponse.json({ transactions: processedTransactions })
    } catch (error) {
        console.error('Get transactions error:', error)
        return NextResponse.json(
            { error: 'Произошла ошибка при получении списка операций' },
            { status: 500 }
        )
    }
}
