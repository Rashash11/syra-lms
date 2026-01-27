
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function check() {
    const fixturesPath = path.join(process.cwd(), 'tests', 'e2e', 'fixtures', 'seed.json');
    if (!fs.existsSync(fixturesPath)) {
        console.error('seed.json not found');
        return;
    }
    const fixtures = JSON.parse(fs.readFileSync(fixturesPath, 'utf8'));

    console.log('Checking Course A:', fixtures.courseAId);
    const course = await prisma.course.findUnique({
        where: { id: fixtures.courseAId },
        include: { sections: { include: { units: true } } }
    });
    console.log('Course:', course ? `${course.code} (${course.status})` : 'NOT FOUND');
    
    if (course) {
        const unit = course.sections.flatMap(s => s.units).find(u => u.id === fixtures.unitVideoId);
        console.log('Unit Video:', unit ? `${unit.title} (${unit.status})` : 'NOT FOUND');
    }

    console.log('Checking Enrollment for Learner A:', fixtures.learnerAId);
    const enrollment = await prisma.enrollment.findUnique({
        where: {
            tenantId_userId_courseId: {
                tenantId: fixtures.tenantAId,
                userId: fixtures.learnerAId,
                courseId: fixtures.courseAId
            }
        }
    });
    console.log('Enrollment:', enrollment ? enrollment.status : 'NOT FOUND');

    console.log('Checking Instructor A:', fixtures.instructorAId);
    const instructor = await prisma.user.findUnique({
        where: { id: fixtures.instructorAId },
        include: { roles: true }
    });
    console.log('Instructor Roles:', instructor?.roles.map(r => r.roleKey));
}

check().catch(console.error).finally(() => prisma.$disconnect());
