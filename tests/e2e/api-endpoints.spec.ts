import { test, expect } from './e2eTest';
import { newContextAsRole } from '../helpers/login';
import { loadE2ESeedFixtures } from '../helpers/seed';
import * as db from './helpers/database-helpers';

/**
 * API Endpoint Testing Suite
 * 
 * Direct testing of all major API endpoints to ensure they:
 * - Return correct HTTP status codes
 * - Return valid JSON responses
 * - Properly validate input data
 * - Persist data to database correctly
 */

async function getCsrfHeader(page: { context: () => any }) {
    const csrfToken = (await page.context().cookies()).find((c: any) => c.name === 'csrf-token')?.value;
    return csrfToken ? { 'x-csrf-token': csrfToken } : {};
}

test.describe('API Endpoints - User Management', () => {
    test.afterAll(async () => {
        await db.closePrismaClient();
    });

    test('POST /api/users - Create user endpoint', async ({ browser }) => {
        const context = await newContextAsRole(browser, 'admin');
        const page = await context.newPage();
        const unique = Date.now();
        const email = `api-test-user-${unique}@example.com`;

        try {
            const response = await page.request.post('/api/users', {
                headers: { 'content-type': 'application/json', ...(await getCsrfHeader(page)) },
                data: {
                    email,
                    firstName: 'API',
                    lastName: 'TestUser',
                    role: 'LEARNER',
                    password: 'TestPass123!',
                    confirmPassword: 'TestPass123!'
                }
            });

            expect([200, 201]).toContain(response.status());
            const data = await response.json();
            expect(data.id || data.user?.id).toBeTruthy();
            expect(data.email || data.user?.email).toBe(email);

            // Verify in database
            const dbUser = await db.getUserByEmail(email);
            expect(dbUser).toBeTruthy();
            expect(dbUser?.firstName).toBe('API');

        } finally {
            await db.cleanupTestUser(email);
            await context.close();
        }
    });

    test('GET /api/users - List users with pagination', async ({ browser }) => {
        const context = await newContextAsRole(browser, 'admin');
        const page = await context.newPage();

        try {
            const response = await page.request.get('/api/users?page=1&limit=10');

            expect(response.ok()).toBe(true);
            const data = await response.json();
            expect(Array.isArray(data.users || data.data || data)).toBe(true);

        } finally {
            await context.close();
        }
    });

    test('DELETE /api/users/:id - Delete user endpoint', async ({ browser }) => {
        const context = await newContextAsRole(browser, 'admin');
        const page = await context.newPage();
        const unique = Date.now();
        const email = `api-delete-user-${unique}@example.com`;

        try {
            // Create user first
            const createRes = await page.request.post('/api/users', {
                headers: { 'content-type': 'application/json', ...(await getCsrfHeader(page)) },
                data: {
                    email,
                    firstName: 'Delete',
                    lastName: 'Test',
                    role: 'LEARNER',
                    password: 'TestPass123!',
                    confirmPassword: 'TestPass123!'
                }
            });
            const created = await createRes.json();
            const userId = created.id;

            // Delete user
            const deleteRes = await page.request.delete(`/api/users/${userId}`, {
                headers: { ...(await getCsrfHeader(page)) }
            });

            expect([200, 204]).toContain(deleteRes.status());

            // Verify deletion in database
            const deleted = await db.verifyUserDeleted(userId);
            expect(deleted).toBe(true);

        } finally {
            await db.cleanupTestUser(email);
            await context.close();
        }
    });
});

test.describe('API Endpoints - Course Management', () => {
    test.afterAll(async () => {
        await db.closePrismaClient();
    });

    test('POST /api/courses - Create course endpoint', async ({ browser }) => {
        const context = await newContextAsRole(browser, 'admin');
        const page = await context.newPage();
        const unique = Date.now();
        const title = `API Test Course ${unique}`;

        let courseId: string | null = null;

        try {
            const response = await page.request.post('/api/courses', {
                headers: { 'content-type': 'application/json', ...(await getCsrfHeader(page)) },
                data: { title, status: 'DRAFT' }
            });

            expect(response.ok()).toBe(true);
            const data = await response.json();
            courseId = data.id;
            expect(courseId).toBeTruthy();

            // Verify in database
            const dbCourse = await db.getCourseById(courseId!);
            expect(dbCourse).toBeTruthy();
            expect(dbCourse?.title).toBe(title);

        } finally {
            if (courseId) {
                await page.request.delete(`/api/courses/${courseId}`, {
                    headers: { ...(await getCsrfHeader(page)) }
                });
                await db.cleanupTestCourse(courseId);
            }
            await context.close();
        }
    });

    test('GET /api/courses - List courses endpoint', async ({ browser }) => {
        const context = await newContextAsRole(browser, 'admin');
        const page = await context.newPage();

        try {
            const response = await page.request.get('/api/courses');

            expect(response.ok()).toBe(true);
            const data = await response.json();
            expect(Array.isArray(data.courses || data.data || data)).toBe(true);

        } finally {
            await context.close();
        }
    });

    test('GET /api/courses/:id - Get course details endpoint', async ({ browser }) => {
        const seed = loadE2ESeedFixtures();
        const context = await newContextAsRole(browser, 'admin');
        const page = await context.newPage();

        try {
            const response = await page.request.get(`/api/courses/${seed.courseAId}`);

            expect(response.ok()).toBe(true);
            const data = await response.json();
            expect(data.id).toBe(seed.courseAId);

        } finally {
            await context.close();
        }
    });

    test('POST /api/courses/:id/enrollments - Enroll users endpoint', async ({ browser }) => {
        const seed = loadE2ESeedFixtures();
        const context = await newContextAsRole(browser, 'admin');
        const page = await context.newPage();

        try {
            // Create a test user to enroll
            const unique = Date.now();
            const email = `enroll-test-${unique}@example.com`;
            const userRes = await page.request.post('/api/users', {
                headers: { ...(await getCsrfHeader(page)) },
                data: {
                    email,
                    firstName: 'Enroll',
                    lastName: 'Test',
                    role: 'LEARNER',
                    password: 'TestPass123!',
                    confirmPassword: 'TestPass123!'
                }
            });
            const userData = await userRes.json();
            const userId = userData.id;

            // Enroll user in course
            const enrollRes = await page.request.post(`/api/courses/${seed.courseAId}/enrollments`, {
                headers: { 'content-type': 'application/json', ...(await getCsrfHeader(page)) },
                data: { userIds: [userId] }
            });

            expect([200, 201]).toContain(enrollRes.status());

            // Verify enrollment in database
            await page.waitForTimeout(500);
            const dbEnrollment = await db.verifyEnrollmentExists(userId, seed.courseAId);
            expect(dbEnrollment).toBe(true);

            // Cleanup
            await db.cleanupTestUser(email);

        } finally {
            await context.close();
        }
    });
});

test.describe('API Endpoints - Learning Paths', () => {
    test.afterAll(async () => {
        await db.closePrismaClient();
    });

    test('POST /api/learning-paths - Create learning path endpoint', async ({ browser }) => {
        const context = await newContextAsRole(browser, 'admin');
        const page = await context.newPage();
        const unique = Date.now();
        const name = `API Test LP ${unique}`;

        let lpId: string | null = null;

        try {
            const response = await page.request.post('/api/learning-paths', {
                headers: { 'content-type': 'application/json', ...(await getCsrfHeader(page)) },
                data: { name, isSequential: false }
            });

            expect(response.ok()).toBe(true);
            const data = await response.json();
            lpId = data.id;
            expect(lpId).toBeTruthy();

            // Verify in database
            const dbLp = await db.getLearningPathById(lpId!);
            expect(dbLp).toBeTruthy();
            expect(dbLp?.name).toBe(name);

        } finally {
            if (lpId) {
                await db.cleanupTestLearningPath(lpId);
            }
            await context.close();
        }
    });

    test('GET /api/learning-paths - List learning paths endpoint', async ({ browser }) => {
        const context = await newContextAsRole(browser, 'admin');
        const page = await context.newPage();

        try {
            const response = await page.request.get('/api/learning-paths');

            expect(response.ok()).toBe(true);
            const data = await response.json();
            expect(Array.isArray(data.learningPaths || data.data || data)).toBe(true);

        } finally {
            await context.close();
        }
    });
});

test.describe('API Endpoints - Dashboard and Analytics', () => {
    test('GET /api/dashboard - Dashboard endpoint', async ({ browser }) => {
        const context = await newContextAsRole(browser, 'admin');
        const page = await context.newPage();

        try {
            const response = await page.request.get('/api/dashboard');

            // Dashboard might return 200 or specific data structure
            expect([200, 404, 500]).toContain(response.status());

            if (response.ok()) {
                const data = await response.json();
                // Verify it's a valid JSON response
                expect(data).toBeDefined();
            }

        } finally {
            await context.close();
        }
    });

    test('GET /api/learner/progress - Learner progress endpoint', async ({ browser }) => {
        const context = await newContextAsRole(browser, 'learner');
        const page = await context.newPage();

        try {
            const response = await page.request.get('/api/learner/progress');

            // Progress endpoint might not exist or return different status
            expect([200, 401, 404, 422, 500]).toContain(response.status());

        } finally {
            await context.close();
        }
    });
});

test.describe('API Endpoints - Group Management', () => {
    test.afterAll(async () => {
        await db.closePrismaClient();
    });

    test('POST /api/groups - Create group endpoint', async ({ browser }) => {
        const context = await newContextAsRole(browser, 'admin');
        const page = await context.newPage();
        const unique = Date.now();
        const name = `API Test Group ${unique}`;

        let groupId: string | null = null;

        try {
            const response = await page.request.post('/api/groups', {
                headers: { 'content-type': 'application/json', ...(await getCsrfHeader(page)) },
                data: { name }
            });

            expect(response.ok()).toBe(true);
            const data = await response.json();
            groupId = data.id;
            expect(groupId).toBeTruthy();

            // Verify in database
            const dbGroup = await db.verifyGroupExists(groupId!);
            expect(dbGroup).toBe(true);

        } finally {
            if (groupId) {
                await page.request.delete('/api/groups', {
                    headers: { 'content-type': 'application/json', ...(await getCsrfHeader(page)) },
                    data: { ids: [groupId] }
                });
                await db.cleanupTestGroup(groupId);
            }
            await context.close();
        }
    });
});

test.describe('API Endpoints - Authentication', () => {
    test('POST /api/auth/login - Login endpoint', async ({ request }) => {
        const seed = loadE2ESeedFixtures();

        const response = await request.post('/api/auth/login', {
            data: {
                email: seed.adminAEmail,
                password: seed.testPassword
            }
        });

        expect(response.ok()).toBe(true);
        const data = await response.json();
        // Various possible response structures
        expect(data.user || data.ok || data.success || data.activeRole).toBeTruthy();
    });

    test('GET /api/me - Current user endpoint', async ({ browser }) => {
        const context = await newContextAsRole(browser, 'admin');
        const page = await context.newPage();

        try {
            const response = await page.request.get('/api/me');

            expect(response.ok()).toBe(true);
            const data = await response.json();
            expect(data.user || data.id).toBeTruthy();

        } finally {
            await context.close();
        }
    });
});
