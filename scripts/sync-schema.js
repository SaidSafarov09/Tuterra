const fs = require('fs');
const path = require('path');

const prismaSchemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
const prismaSchemaSqlitePath = path.join(__dirname, '..', 'prisma', 'schema.sqlite.prisma');

try {
    let content = fs.readFileSync(prismaSchemaPath, 'utf8');

    // Replace postgres provider with sqlite
    content = content.replace('provider = "postgresql"', 'provider = "sqlite"');

    // Replace url with local sqlite file
    content = content.replace('url      = env("DATABASE_URL")', 'url      = "file:./dev.db"');

    // Additional check if the user uses directUrl or other postgres specifics, remove them
    // (Assuming simple schema for now, but this might need regex for more complex cases)

    fs.writeFileSync(prismaSchemaSqlitePath, content);
    console.log('Successfully synced schema.sqlite.prisma from schema.prisma');
} catch (error) {
    console.error('Error syncing schemas:', error);
    process.exit(1);
}
