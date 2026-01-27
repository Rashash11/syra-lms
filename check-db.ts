import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL
        }
    }
});

async function main() {
    try {
        const users = await prisma.user.findMany({
            take: 20,
            select: { email: true, activeRole: true }
        });
        console.log('Users found:');
        console.table(users);

        const admin = await prisma.user.findFirst({
            where: { activeRole: 'ADMIN' }
        });
        if (admin) {
            console.log(`Found admin: ${admin.email}`);
        } else {
            console.log('No admin user found!');
        }
    } catch (error) {
        console.error('Database query failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
