
import { prisma } from './lib/prisma'

async function main() {
    const ghostId = 'cmj674gz10000b7artmglarmd'

    console.log('--- Searching for Ghost User ---')
    const user = await prisma.user.findUnique({
        where: { id: ghostId },
        include: { authProviders: true }
    })

    if (user) {
        console.log('Ghost User Found!')
        console.log('ID:', user.id)
        console.log('Email:', user.email)
        console.log('Name:', user.name)
        console.log('TelegramId:', user.telegramId)
    } else {
        console.log('User cmj67... NOT FOUND in this database. Check environment variables!')
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
