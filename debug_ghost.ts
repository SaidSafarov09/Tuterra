
import { prisma } from './lib/prisma'

async function main() {
    const ghostId = 'cmj674gz10000b7artmglarmd'

    const user = await prisma.user.findUnique({
        where: { id: ghostId },
        include: { authProviders: true }
    })
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
