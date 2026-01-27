const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const user = await prisma.user.findFirst({
            select: { role: true }
        });
        console.log('Success! role field is available.');
    } catch (e) {
        console.error('Error fetching role:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
