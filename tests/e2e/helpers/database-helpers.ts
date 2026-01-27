import { PrismaClient } from '@prisma/client';

/**
 * Database helper functions for E2E test verification
 * These functions allow tests to verify database state directly
 */

let prisma: PrismaClient | null = null;

export function getPrismaClient(): PrismaClient {
    if (!prisma) {
        prisma = new PrismaClient();
    }
    return prisma;
}

export async function closePrismaClient() {
    if (prisma) {
        await prisma.$disconnect();
        prisma = null;
    }
}

/**
 * User verification helpers
 */
export async function verifyUserExists(email: string, tenantId?: string): Promise<boolean> {
    const db = getPrismaClient();
    const where: any = { email };
    if (tenantId) where.tenantId = tenantId;

    const user = await db.user.findFirst({ where });
    return user !== null;
}

export async function getUserByEmail(email: string, tenantId?: string) {
    const db = getPrismaClient();
    const where: any = { email };
    if (tenantId) where.tenantId = tenantId;

    return await db.user.findFirst({ where });
}

export async function getUserById(userId: string, tenantId?: string) {
    const db = getPrismaClient();
    const where: any = { id: userId };
    if (tenantId) where.tenantId = tenantId;

    return await db.user.findFirst({ where });
}

export async function verifyUserDeleted(userId: string, tenantId?: string): Promise<boolean> {
    const db = getPrismaClient();
    const where: any = { id: userId };
    if (tenantId) where.tenantId = tenantId;

    const user = await db.user.findFirst({ where });
    return user === null || user.deletedAt !== null;
}

export async function countUsers(tenantId?: string): Promise<number> {
    const db = getPrismaClient();
    const where: any = {};
    if (tenantId) where.tenantId = tenantId;

    return await db.user.count({ where });
}

/**
 * Course verification helpers
 */
export async function verifyCourseExists(courseId: string, tenantId?: string): Promise<boolean> {
    const db = getPrismaClient();
    const where: any = { id: courseId };
    if (tenantId) where.tenantId = tenantId;

    const course = await db.course.findFirst({ where });
    return course !== null;
}

export async function getCourseById(courseId: string, tenantId?: string) {
    const db = getPrismaClient();
    const where: any = { id: courseId };
    if (tenantId) where.tenantId = tenantId;

    return await db.course.findFirst({
        where,
        include: {
            units: true,
            sections: true,
            enrollments: true
        }
    });
}

export async function verifyCourseDeleted(courseId: string, tenantId?: string): Promise<boolean> {
    const db = getPrismaClient();
    const where: any = { id: courseId };
    if (tenantId) where.tenantId = tenantId;

    const course = await db.course.findFirst({ where });
    return course === null || course.deletedAt !== null;
}

export async function getCourseUnitCount(courseId: string, tenantId?: string): Promise<number> {
    const db = getPrismaClient();
    const where: any = { courseId };
    if (tenantId) where.tenantId = tenantId;

    return await db.courseUnit.count({ where });
}

/**
 * Enrollment verification helpers
 */
export async function verifyEnrollmentExists(userId: string, courseId: string, tenantId?: string): Promise<boolean> {
    const db = getPrismaClient();
    const where: any = { userId, courseId };
    if (tenantId) where.tenantId = tenantId;

    const enrollment = await db.enrollment.findFirst({ where });
    return enrollment !== null;
}

export async function getEnrollment(userId: string, courseId: string, tenantId?: string) {
    const db = getPrismaClient();
    const where: any = { userId, courseId };
    if (tenantId) where.tenantId = tenantId;

    return await db.enrollment.findFirst({ where });
}

export async function verifyEnrollmentStatus(
    userId: string,
    courseId: string,
    expectedStatus: string,
    tenantId?: string
): Promise<boolean> {
    const enrollment = await getEnrollment(userId, courseId, tenantId);
    return enrollment?.status === expectedStatus;
}

export async function getEnrollmentProgress(userId: string, courseId: string, tenantId?: string): Promise<number> {
    const enrollment = await getEnrollment(userId, courseId, tenantId);
    return enrollment?.progress || 0;
}

/**
 * Learning Path verification helpers
 */
export async function verifyLearningPathExists(pathId: string, tenantId?: string): Promise<boolean> {
    const db = getPrismaClient();
    const where: any = { id: pathId };
    if (tenantId) where.tenantId = tenantId;

    const path = await db.learningPath.findFirst({ where });
    return path !== null;
}

export async function getLearningPathById(pathId: string, tenantId?: string) {
    const db = getPrismaClient();
    const where: any = { id: pathId };
    if (tenantId) where.tenantId = tenantId;

    return await db.learningPath.findFirst({
        where,
        include: {
            courses: true,
            enrollments: true
        }
    });
}

export async function verifyLearningPathEnrollment(
    userId: string,
    pathId: string,
    tenantId?: string
): Promise<boolean> {
    const db = getPrismaClient();
    const where: any = { userId, pathId };
    if (tenantId) where.tenantId = tenantId;

    const enrollment = await db.learningPathEnrollment.findFirst({ where });
    return enrollment !== null;
}

export async function getLearningPathCourseCount(pathId: string, tenantId?: string): Promise<number> {
    const db = getPrismaClient();
    const where: any = { pathId };
    if (tenantId) where.tenantId = tenantId;

    return await db.learningPathCourse.count({ where });
}

/**
 * Assignment verification helpers
 */
export async function verifyAssignmentExists(assignmentId: string, tenantId?: string): Promise<boolean> {
    const db = getPrismaClient();
    const where: any = { id: assignmentId };
    if (tenantId) where.tenantId = tenantId;

    const assignment = await db.assignment.findFirst({ where });
    return assignment !== null;
}

export async function getAssignmentById(assignmentId: string, tenantId?: string) {
    const db = getPrismaClient();
    const where: any = { id: assignmentId };
    if (tenantId) where.tenantId = tenantId;

    return await db.assignment.findFirst({
        where,
        include: {
            submissions: true
        }
    });
}

export async function verifyAssignmentSubmission(
    assignmentId: string,
    userId: string,
    tenantId?: string
): Promise<boolean> {
    const db = getPrismaClient();
    const where: any = { assignmentId, userId };
    if (tenantId) where.tenantId = tenantId;

    const submission = await db.assignmentSubmission.findFirst({ where });
    return submission !== null;
}

export async function getAssignmentSubmissionStatus(
    assignmentId: string,
    userId: string,
    tenantId?: string
): Promise<string | null> {
    const db = getPrismaClient();
    const where: any = { assignmentId, userId };
    if (tenantId) where.tenantId = tenantId;

    const submission = await db.assignmentSubmission.findFirst({ where });
    return submission?.status || null;
}

/**
 * Group verification helpers
 */
export async function verifyGroupExists(groupId: string, tenantId?: string): Promise<boolean> {
    const db = getPrismaClient();
    const where: any = { id: groupId };
    if (tenantId) where.tenantId = tenantId;

    const group = await db.group.findFirst({ where });
    return group !== null;
}

export async function getGroupMemberCount(groupId: string, tenantId?: string): Promise<number> {
    const db = getPrismaClient();
    const where: any = { groupId };
    if (tenantId) where.tenantId = tenantId;

    return await db.groupMember.count({ where });
}

export async function verifyGroupMembership(
    groupId: string,
    userId: string,
    tenantId?: string
): Promise<boolean> {
    const db = getPrismaClient();
    const where: any = { groupId, userId };
    if (tenantId) where.tenantId = tenantId;

    const member = await db.groupMember.findFirst({ where });
    return member !== null;
}

/**
 * Tenant isolation verification
 */
export async function verifyTenantIsolation(
    tenantAId: string,
    tenantBId: string
): Promise<{ isolated: boolean; violations: string[] }> {
    const db = getPrismaClient();
    const violations: string[] = [];

    // Check users
    const tenantAUsers = await db.user.findMany({ where: { tenantId: tenantAId } });
    const tenantBUsers = await db.user.findMany({ where: { tenantId: tenantBId } });

    for (const user of tenantAUsers) {
        const crossTenantEnrollment = await db.enrollment.findFirst({
            where: { userId: user.id, NOT: { tenantId: tenantAId } }
        });
        if (crossTenantEnrollment) {
            violations.push(`User ${user.id} from tenant A has enrollment in tenant ${crossTenantEnrollment.tenantId}`);
        }
    }

    // Check courses
    const tenantACourses = await db.course.findMany({ where: { tenantId: tenantAId } });
    for (const course of tenantACourses) {
        const crossTenantEnrollment = await db.enrollment.findFirst({
            where: { courseId: course.id, NOT: { tenantId: tenantAId } }
        });
        if (crossTenantEnrollment) {
            violations.push(`Course ${course.id} from tenant A has enrollment in tenant ${crossTenantEnrollment.tenantId}`);
        }
    }

    return {
        isolated: violations.length === 0,
        violations
    };
}

/**
 * Database cleanup helpers for tests
 */
export async function cleanupTestUser(email: string, tenantId?: string) {
    const db = getPrismaClient();
    const where: any = { email };
    if (tenantId) where.tenantId = tenantId;

    await db.user.deleteMany({ where });
}

export async function cleanupTestCourse(courseId: string, tenantId?: string) {
    const db = getPrismaClient();
    const where: any = { id: courseId };
    if (tenantId) where.tenantId = tenantId;

    await db.course.deleteMany({ where });
}

export async function cleanupTestGroup(groupId: string, tenantId?: string) {
    const db = getPrismaClient();
    const where: any = { id: groupId };
    if (tenantId) where.tenantId = tenantId;

    await db.group.deleteMany({ where });
}

export async function cleanupTestLearningPath(pathId: string, tenantId?: string) {
    const db = getPrismaClient();
    const where: any = { id: pathId };
    if (tenantId) where.tenantId = tenantId;

    await db.learningPath.deleteMany({ where });
}
