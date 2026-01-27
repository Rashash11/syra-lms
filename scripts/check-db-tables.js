// Quick test to verify tables exist
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkTables() {
    try {
        console.log('Checking if User table exists...');
        const count = await prisma.user.count();
        console.log(`✓ User table exists! Found ${count} users`);

        if (count === 0) {
            console.log('\n⚠️  No users in database!');
            console.log('Run: npm run db:seed');
        } else {
            const sample = await prisma.user.findMany({ take: 3 });
            console.log('\nSample users:');
            sample.forEach(u => {
                console.log(`  - ${u.firstName} ${u.lastName} (${u.email})`);
            });
        }

        await prisma.$disconnect();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        await prisma.$disconnect();
        process.exit(1);
    }
}

checkTables();
