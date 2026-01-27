// Check the actual database schema for lastLoginAt column
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSchema() {
    console.log('Checking lastLoginAt column type in database...\n');

    try {
        const result = await prisma.$queryRaw`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'users' 
            AND column_name = 'lastLoginAt'
        `;

        console.log('Column info:');
        console.log(result);

        // Also check what Prisma schema says
        console.log('\nChecking a sample user lastLoginAt value:');
        const user = await prisma.user.findFirst({
            where: { lastLoginAt: { not: null } },
            select: { id: true, email: true, lastLoginAt: true }
        });

        if (user) {
            console.log('Sample user:', user);
            console.log('lastLoginAt type:', typeof user.lastLoginAt);
            console.log('lastLoginAt value:', user.lastLoginAt);
        }

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await prisma.$disconnect();
    }
}

checkSchema();
