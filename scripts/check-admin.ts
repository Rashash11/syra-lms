import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });

const prisma = new PrismaClient();

async function check() {
    console.log('Checking admin user...');
    const user = await prisma.user.findFirst({
        where: { email: 'admin-a@test.local' }
    });
    console.log('User found:', !!user);
    if (user) {
        console.log('User ID:', user.id);
        console.log('Expected ID: 00615061-cc5b-48fc-bc79-1d5c2d6f7cb3');
        console.log('ID Match:', user.id === '00615061-cc5b-48fc-bc79-1d5c2d6f7cb3');
        console.log('Token Version:', user.tokenVersion);
    }
}

check().catch(e => console.error(e)).finally(() => prisma.$disconnect());
