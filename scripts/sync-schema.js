const fs = require('fs');
const path = require('path');

const prismaSchemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
const prismaSchemaSqlitePath = path.join(__dirname, '..', 'prisma', 'schema.sqlite.prisma');

try {
    let content = fs.readFileSync(prismaSchemaPath, 'utf8');
    content = content.replace('provider = "postgresql"', 'provider = "sqlite"');
    content = content.replace('url      = env("DATABASE_URL")', 'url      = "file:./dev.db"');
    content = content.replace(/output\s*=\s*"\.\.\/node_modules\/@prisma\/client-postgres"/, '');

    fs.writeFileSync(prismaSchemaSqlitePath, content);
    console.log('Successfully synced schema.sqlite.prisma from schema.prisma');
} catch (error) {
    console.error('Error syncing schemas:', error);
    process.exit(1);
}
