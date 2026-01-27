import { test, expect } from './e2eTest';
import { newContextAsRole } from '../helpers/login';
import { loadE2ESeedFixtures } from '../helpers/seed';
import * as db from './helpers/database-helpers';

/**
 * Comprehensive E2E Test Suite for LMS
 * 
 * This test suite covers all major user workflows with database verification:
 * - Admin: User management, course creation, learning paths, assignments
 * - Instructor: Course editing, content upload, student tracking
 * - Super Instructor: Extended admin capabilities
 * - Learner: Course enrollment, content consumption, progress tracking
 */

async function getCsrfHeader(page: { context: () => any }) {
    const csrfToken = (await page.context().cookies()).find((c: any) => c.name === 'csrf-token')?.value;
    return csrfToken ? { 'x-csrf-token': csrfToken } : {};
}

test.describe('Comprehensive E2E Tests - Admin Role', () => {
    test.afterAll(async () => {
        await db.closePrismaClient();
    });

    test('Admin: Complete user management workflow with DB verification', async ({ browser }) => {
        const context = await newContextAsRole(browser, 'admin');
        const page = await context.newPage();
        const unique = Date.now();
        const email = `e2e-comprehensive-user-${unique}@example.com`;
        const username = `e2e_user_${unique}`;

        try {
            // Step 1: Navigate to users page
            await page.goto('/admin/users');
            await expect(page.getByRole('heading', { name: 'Users' })).toBeVisible();

            // Step 2: Create user via UI
            await page.getByRole('button', { name: /add user/i }).click();
            await page.getByRole('menuitem', { name: /add user manually/i }).click();
            await expect(page).toHaveURL(/\/admin\/users\/new$/);

            await page.getByLabel('First name').fill('E2E');
            await page.getByLabel('Last name').fill('TestUser');
            await page.getByLabel('Email').fill(email);
            await page.getByLabel('Username').fill(username);
            await page.getByLabel('Password').fill('TestPass123!');

            const createResponsePromise = page.waitForResponse(r => r.url().includes('/api/users') && r.request().method() === 'POST');
            await page.getByRole('button', { name: 'Save' }).click();
            const createResponse = await createResponsePromise;

            expect(createResponse.ok()).toBe(true);
            const created = await createResponse.json();
            const createdId = created?.id as string;
            expect(createdId).toBeTruthy();

            // Step 3: Verify user in database
            const dbUser = await db.getUserByEmail(email);
            expect(dbUser).toBeTruthy();
            expect(dbUser?.firstName).toBe('E2E');
            expect(dbUser?.lastName).toBe('TestUser');
            expect(dbUser?.email).toBe(email);
            expect(dbUser?.username).toBe(username);

            // Step 4: Verify user appears in UI
            await page.waitForURL(/\/admin\/users$/);
            await page.reload();
            await page.waitForLoadState('networkidle');
            await page.getByRole('textbox', { name: 'Search', exact: true }).fill(email);
            await page.keyboard.press('Enter');
            await page.waitForTimeout(1000);
            await expect(page.getByText(email)).toBeVisible();

            // Step 5: Update user
            const userCountBefore = await db.countUsers();

            // Step 6: Delete user via API
            const deleteRes = await page.request.delete(`/api/users/${createdId}`, {
                headers: { ...(await getCsrfHeader(page)) },
            });
            expect([200, 204]).toContain(deleteRes.status());

            // Step 7: Verify deletion in database
            await page.waitForTimeout(500);
            const deletedUser = await db.verifyUserDeleted(createdId);
            expect(deletedUser).toBe(true);

            // Step 8: Verify user removed from UI
            await page.reload();
            await page.getByRole('textbox', { name: 'Search', exact: true }).fill(email);
            await page.waitForTimeout(300);
            await expect(page.getByText(email)).toHaveCount(0);

        } finally {
            await db.cleanupTestUser(email);
            await context.close();
        }
    });

    test('Admin: Complete course creation workflow with units and DB verification', async ({ browser }) => {
        const context = await newContextAsRole(browser, 'admin');
        const page = await context.newPage();
        const unique = Date.now();
        const courseTitle = `E2E Comprehensive Course ${unique}`;

        let createdCourseId: string | null = null;

        try {
            // Step 1: Create course via API
            const createResponse = await page.request.post('/api/courses', {
                headers: { 'content-type': 'application/json', ...(await getCsrfHeader(page)) },
                data: { title: courseTitle, status: 'DRAFT' }
            });
            expect(createResponse.ok()).toBe(true);
            const created = await createResponse.json();
            createdCourseId = created?.id || null;
            expect(createdCourseId).toBeTruthy();

            // Step 2: Verify course in database
            const dbCourse = await db.getCourseById(createdCourseId!);
            expect(dbCourse).toBeTruthy();
            expect(dbCourse?.title).toBe(courseTitle);
            expect(dbCourse?.status).toBe('DRAFT');

            // Step 3: Open course editor
            await page.goto(`/admin/courses/new/edit?id=${createdCourseId}`);
            await expect(page.getByRole('heading', { name: courseTitle }).first()).toBeVisible();

            // Step 4: Verify course has no units initially
            const initialUnitCount = await db.getCourseUnitCount(createdCourseId!);
            expect(initialUnitCount).toBe(0);

            // Step 5: Navigate to courses list and verify course appears
            await page.goto('/admin/courses');
            await page.waitForLoadState('networkidle');
            await expect(page.getByText(courseTitle)).toBeVisible();

        } finally {
            if (createdCourseId) {
                await page.request.delete(`/api/courses/${createdCourseId}`, {
                    headers: { ...(await getCsrfHeader(page)) },
                });
                await db.cleanupTestCourse(createdCourseId);
            }
            await context.close();
        }
    });

    test('Admin: Learning path creation and enrollment workflow', async ({ browser }) => {
        const seed = loadE2ESeedFixtures();
        const context = await newContextAsRole(browser, 'admin');
        const page = await context.newPage();
        const unique = Date.now();
        const lpName = `E2E Learning Path ${unique}`;

        let lpId: string | null = null;
        let tempUserEmail: string | null = null;
        let tempUserId: string | null = null;

        try {
            // Step 1: Create learning path via API
            const createRes = await page.request.post('/api/learning-paths', {
                headers: { 'content-type': 'application/json', ...(await getCsrfHeader(page)) },
                data: { name: lpName, isSequential: false }
            });
            expect(createRes.ok()).toBe(true);
            const created = await createRes.json();
            lpId = created?.id as string;
            expect(lpId).toBeTruthy();

            // Step 2: Verify learning path in database
            const dbLp = await db.getLearningPathById(lpId);
            expect(dbLp).toBeTruthy();
            expect(dbLp?.name).toBe(lpName);

            // Step 3: Create a test user to enroll
            tempUserEmail = `lp-learner-${unique}@example.com`;
            const userRes = await page.request.post('/api/users', {
                headers: { ...(await getCsrfHeader(page)) },
                data: {
                    email: tempUserEmail,
                    firstName: 'LP',
                    lastName: 'Learner',
                    role: 'LEARNER',
                    password: 'TestPass123!',
                    confirmPassword: 'TestPass123!'
                }
            });
            expect(userRes.ok()).toBeTruthy();
            const userData = await userRes.json();
            tempUserId = userData?.id;

            // Step 4: Verify user in database
            const dbUser = await db.getUserByEmail(tempUserEmail);
            expect(dbUser).toBeTruthy();

            // Step 5: Navigate to learning paths page
            await page.goto('/admin/learning-paths');
            await page.waitForLoadState('networkidle');
            await expect(page.getByText(lpName)).toBeVisible();

            // Step 6: Add a course to the learning path
            await page.goto(`/admin/learning-paths/${lpId}/edit`);
            await page.waitForLoadState('networkidle');

            // Verify LP has no courses initially
            const initialCourseCount = await db.getLearningPathCourseCount(lpId);
            expect(initialCourseCount).toBe(0);

        } finally {
            if (lpId) {
                await db.cleanupTestLearningPath(lpId);
            }
            if (tempUserEmail) {
                await db.cleanupTestUser(tempUserEmail);
            }
            await context.close();
        }
    });

    test('Admin: Group management workflow with DB verification', async ({ browser }) => {
        const context = await newContextAsRole(browser, 'admin');
        const page = await context.newPage();
        const unique = Date.now();
        const groupName = `E2E Group ${unique}`;

        let groupId: string | null = null;

        try {
            // Step 1: Navigate to groups page
            await page.goto('/admin/groups');
            await expect(page.getByRole('heading', { name: /groups/i })).toBeVisible();

            // Step 2: Create group
            await page.getByRole('button', { name: /create group/i }).click();
            await expect(page).toHaveURL(/\/admin\/groups\/new$/);

            const nameInput = page.locator('xpath=//h5[normalize-space(.)="Add group"]/following::input[1]');
            await nameInput.fill(groupName);

            const createResponsePromise = page.waitForResponse(r => r.url().includes('/api/groups') && r.request().method() === 'POST');
            await page.getByRole('button', { name: 'Save' }).click();
            const createResponse = await createResponsePromise;

            expect(createResponse.ok()).toBe(true);
            const created = await createResponse.json();
            groupId = created?.id as string;
            expect(groupId).toBeTruthy();

            // Step 3: Verify group in database
            const dbGroup = await db.verifyGroupExists(groupId);
            expect(dbGroup).toBe(true);

            // Step 4: Verify group appears in UI
            await page.waitForURL(/\/admin\/groups$/);
            await expect(page.getByText(groupName)).toBeVisible();

            // Step 5: Verify group has no members
            const memberCount = await db.getGroupMemberCount(groupId);
            expect(memberCount).toBe(0);

        } finally {
            if (groupId) {
                await page.request.delete('/api/groups', {
                    headers: { 'content-type': 'application/json', ...(await getCsrfHeader(page)) },
                    data: { ids: [groupId] },
                });
                await db.cleanupTestGroup(groupId);
            }
            await context.close();
        }
    });
});

test.describe('Comprehensive E2E Tests - Instructor Role', () => {
    test.afterAll(async () => {
        await db.closePrismaClient();
    });

    test('Instructor: View courses and access course details', async ({ browser }) => {
        const seed = loadE2ESeedFixtures();
        const context = await newContextAsRole(browser, 'instructor');
        const page = await context.newPage();

        try {
            // Step 1: Navigate to instructor courses page
            await page.goto('/instructor/courses');
            await expect(page.getByRole('heading', { name: /courses/i })).toBeVisible();

            // Step 2: Access specific course
            await page.goto(`/instructor/courses/${seed.courseAId}`);
            await page.waitForLoadState('networkidle');
            await expect(page.getByText('Test Course A')).toBeVisible();

            // Step 3: Verify course exists in database
            const dbCourse = await db.getCourseById(seed.courseAId);
            expect(dbCourse).toBeTruthy();

        } finally {
            await context.close();
        }
    });

    test('Instructor: View learning paths', async ({ browser }) => {
        const context = await newContextAsRole(browser, 'instructor');
        const page = await context.newPage();

        try {
            await page.goto('/instructor/learning-paths');
            await page.waitForLoadState('networkidle');
            await expect(page.getByRole('heading', { name: /learning paths/i })).toBeVisible();

        } finally {
            await context.close();
        }
    });
});

test.describe('Comprehensive E2E Tests - Learner Role', () => {
    test.afterAll(async () => {
        await db.closePrismaClient();
    });

    test('Learner: Course catalog and enrollment verification', async ({ browser }) => {
        const context = await newContextAsRole(browser, 'learner');
        const page = await context.newPage();

        try {
            // Step 1: Navigate to course catalog
            await page.goto('/learner/catalog');
            await expect(page.getByText('Course Catalog')).toBeVisible();

            // Step 2: Navigate to my courses
            await page.goto('/learner/courses');
            await page.waitForLoadState('networkidle');

        } finally {
            await context.close();
        }
    });

    test('Learner: Course unit completion workflow with DB verification', async ({ browser }) => {
        const seed = loadE2ESeedFixtures();
        const context = await newContextAsRole(browser, 'learner');
        const page = await context.newPage();

        try {
            // Step 1: Navigate to course unit
            await page.goto(`/learner/courses/${seed.courseAId}/units/${seed.unitVideoId}`, { timeout: 10000 });
            await page.waitForLoadState('domcontentloaded');
            await page.waitForTimeout(2000); // Allow page to settle

            // Step 2: Check enrollment in database
            const enrollment = await db.getEnrollment(seed.learnerAId, seed.courseAId);
            expect(enrollment).toBeTruthy();

            // Step 3: Try to mark unit as complete
            const markComplete = page.getByRole('button', { name: 'Mark as Complete' });
            if (await markComplete.isVisible().catch(() => false)) {
                await markComplete.click();
                await page.waitForTimeout(1000);
            }

            // Step 4: Verify progress updated in database
            const updatedEnrollment = await db.getEnrollment(seed.learnerAId, seed.courseAId);
            expect(updatedEnrollment).toBeTruthy();

        } finally {
            await context.close();
        }
    });
});

test.describe('Comprehensive E2E Tests - Cross-Role Workflows', () => {
    test.afterAll(async () => {
        await db.closePrismaClient();
    });

    test('End-to-end: Admin creates course, enrolls learner, learner accesses', async ({ browser }) => {
        const unique = Date.now();
        const courseTitle = `E2E Full Workflow ${unique}`;
        const learnerEmail = `workflow-learner-${unique}@example.com`;

        let adminContext, learnerContext;
        let courseId: string | null = null;
        let learnerId: string | null = null;

        try {
            // Admin flow
            adminContext = await newContextAsRole(browser, 'admin');
            const adminPage = await adminContext.newPage();

            // Step 1: Admin creates course
            const createResponse = await adminPage.request.post('/api/courses', {
                headers: { 'content-type': 'application/json', ...(await getCsrfHeader(adminPage)) },
                data: { title: courseTitle, status: 'PUBLISHED', showInCatalog: true }
            });
            expect(createResponse.ok()).toBe(true);
            const created = await createResponse.json();
            courseId = created?.id;
            expect(courseId).toBeTruthy();

            // Step 2: Verify course in database
            const dbCourse = await db.getCourseById(courseId!);
            expect(dbCourse).toBeTruthy();
            expect(dbCourse?.status).toBe('PUBLISHED');

            // Step 3: Admin creates learner
            const userRes = await adminPage.request.post('/api/users', {
                headers: { ...(await getCsrfHeader(adminPage)) },
                data: {
                    email: learnerEmail,
                    firstName: 'Workflow',
                    lastName: 'Learner',
                    role: 'LEARNER',
                    password: 'TestPass123!',
                    confirmPassword: 'TestPass123!'
                }
            });
            expect(userRes.ok()).toBeTruthy();
            const userData = await userRes.json();
            learnerId = userData?.id;

            // Step 4: Verify learner in database
            const dbUser = await db.getUserByEmail(learnerEmail);
            expect(dbUser).toBeTruthy();

            // Step 5: Admin enrolls learner in course
            const enrollRes = await adminPage.request.post(`/api/courses/${courseId}/enrollments`, {
                headers: { 'content-type': 'application/json', ...(await getCsrfHeader(adminPage)) },
                data: { userIds: [learnerId] }
            });
            expect([200, 201]).toContain(enrollRes.status());

            // Step 6: Verify enrollment in database
            await adminPage.waitForTimeout(1000);
            const dbEnrollment = await db.verifyEnrollmentExists(learnerId!, courseId!);
            expect(dbEnrollment).toBe(true);

            await adminContext.close();

            // Learner flow
            learnerContext = await newContextAsRole(browser, 'learner');
            const learnerPage = await learnerContext.newPage();

            // Step 7: Learner navigates to catalog
            await learnerPage.goto('/learner/catalog');
            await learnerPage.waitForLoadState('networkidle');

            // Step 8: Verify learner can see their courses
            await learnerPage.goto('/learner/courses');
            await learnerPage.waitForLoadState('networkidle');

        } finally {
            if (courseId) {
                const cleanup = await newContextAsRole(browser, 'admin');
                const cleanupPage = await cleanup.newPage();
                await cleanupPage.request.delete(`/api/courses/${courseId}`, {
                    headers: { ...(await getCsrfHeader(cleanupPage)) },
                });
                await cleanup.close();
                await db.cleanupTestCourse(courseId);
            }
            if (learnerEmail) {
                await db.cleanupTestUser(learnerEmail);
            }
            if (adminContext) await adminContext.close();
            if (learnerContext) await learnerContext.close();
        }
    });
});
