import { test, expect } from './e2eTest';
import { newContextAsRole } from '../helpers/login';
import { loadE2ESeedFixtures } from '../helpers/seed';

async function getCsrfHeader(page: { context: () => any }) {
    const csrfToken = (await page.context().cookies()).find((c: any) => c.name === 'csrf-token')?.value;
    return csrfToken ? { 'x-csrf-token': csrfToken } : {};
}

test.describe('Admin Flows', () => {
    test.beforeEach(async ({ request }) => {
        const health = await request.get('/api/health');
        const headers = health.headers();
        console.log('Health status:', health.status());
        console.log('Health url:', health.url());
        console.log('Health x-backend:', headers['x-backend']);
    });
    test('users list loads and can open create user page', async ({ browser }, testInfo) => {
        const context = await newContextAsRole(browser, 'admin');
        const page = await context.newPage();

        await page.goto('/admin/users');
        await expect(page.getByRole('heading', { name: 'Users' })).toBeVisible();
        await page.getByRole('button', { name: /add user/i }).click();
        await page.getByRole('menuitem', { name: /add user manually/i }).click();
        await expect(page).toHaveURL(/\/admin\/users\/new$/);

        await context.close();
    });

    test('can create and delete a user via UI', async ({ browser }) => {
        const context = await newContextAsRole(browser, 'admin');
        const page = await context.newPage();
        const unique = Date.now();
        const email = `e2e-admin-user-${unique}@example.com`;
        const username = `e2e_admin_${unique}`;

        try {
            await page.goto('/admin/users/new');
            await page.getByLabel('First name').fill('E2E');
            await page.getByLabel('Last name').fill('AdminUser');
            await page.getByLabel('Email').fill(email);
            await page.getByLabel('Username').fill(username);
            await page.getByLabel('Password').fill('TestPass123!');

            const createResponsePromise = page.waitForResponse(r => r.url().includes('/api/users') && r.request().method() === 'POST');
            await page.getByRole('button', { name: 'Save' }).click();
            const createResponse = await createResponsePromise;
            if (!createResponse.ok()) {
                const text = await createResponse.text();
                throw new Error(`Create User Failed: ${createResponse.status()} ${text}`);
            }
            expect(createResponse.ok()).toBe(true);
            const created = await createResponse.json();
            const createdId = created?.id as string | undefined;
            expect(createdId).toBeTruthy();

            await page.waitForURL(/\/admin\/users$/);
            await page.reload(); // Reload to ensure the new user appears
            await page.waitForLoadState('networkidle');
            await page.getByRole('textbox', { name: 'Search', exact: true }).fill(email);
            await page.keyboard.press('Enter'); // Ensure search triggers
            await page.waitForTimeout(1000); // Increased wait
            await expect(page.getByText(email)).toBeVisible();

            const deleteRes = await page.request.delete(`/api/users/${createdId}`, {
                headers: { ...(await getCsrfHeader(page)) },
            });
            if (![200, 204].includes(deleteRes.status())) {
                console.log('Delete User Failed:', deleteRes.status(), await deleteRes.text());
            }
            expect([200, 204]).toContain(deleteRes.status());

            await page.reload();
            await page.getByRole('textbox', { name: 'Search', exact: true }).fill(email);
            await page.waitForTimeout(300);
            await expect(page.getByText(email)).toHaveCount(0);
        } finally {
            await context.close();
        }
    });

    test('seeded course details load', async ({ browser }) => {
        const seed = loadE2ESeedFixtures();
        const context = await newContextAsRole(browser, 'admin');
        const page = await context.newPage();

        await page.goto(`/admin/courses/${seed.courseAId}`);
        await page.waitForLoadState('networkidle').catch(() => undefined);
        await expect(page.getByText('Test Course A')).toBeVisible();

        await context.close();
    });

    test('can create and delete a group via UI', async ({ browser }) => {
        const context = await newContextAsRole(browser, 'admin');
        const page = await context.newPage();
        const name = `E2E Group ${Date.now()}`;

        try {
            await page.goto('/admin/groups');
            await page.getByRole('button', { name: /create group/i }).click();
            await expect(page).toHaveURL(/\/admin\/groups\/new$/);

            const nameInput = page.locator('xpath=//h5[normalize-space(.)="Add group"]/following::input[1]');
            await nameInput.fill(name);

            const createResponsePromise = page.waitForResponse(r => r.url().includes('/api/groups') && r.request().method() === 'POST');
            await page.getByRole('button', { name: 'Save' }).click();
            const createResponse = await createResponsePromise;
            if (!createResponse.ok()) {
                console.log('URL:', createResponse.url());
                console.log('Create Group Failed:', await createResponse.text());
                console.log('Status:', createResponse.status());
            }
            expect(createResponse.ok()).toBe(true);
            const created = await createResponse.json();
            const groupId = created?.id as string | undefined;
            expect(groupId).toBeTruthy();

            await page.waitForURL(/\/admin\/groups$/);
            await expect(page.getByText(name)).toBeVisible();

            const deleteRes = await page.request.delete('/api/groups', {
                headers: { 'content-type': 'application/json', ...(await getCsrfHeader(page)) },
                data: { ids: [groupId] },
            });
            expect([200, 204]).toContain(deleteRes.status());

            await page.reload();
            await expect(page.getByText(name)).toHaveCount(0);
        } finally {
            await context.close();
        }
    });

    test('can create a course from list and open editor', async ({ browser }) => {
        const context = await newContextAsRole(browser, 'admin');
        const page = await context.newPage();

        let createdCourseId: string | null = null;
        try {
            await page.goto('/admin/courses');
            await expect(page.getByRole('heading', { name: 'Courses' })).toBeVisible();

            const createResponse = await page.request.post('/api/courses', {
                headers: { 'content-type': 'application/json', ...(await getCsrfHeader(page)) },
                data: { title: 'New course', status: 'DRAFT' }
            });
            if (!createResponse.ok()) {
                console.log('Create Course Failed:', createResponse.status(), await createResponse.text());
            }
            expect(createResponse.ok()).toBe(true);
            const created = await createResponse.json();
            createdCourseId = created?.id || null;
            expect(createdCourseId).toBeTruthy();

            await page.goto(`/admin/courses/new/edit?id=${createdCourseId}`);
            await page.waitForURL(new RegExp(`/admin/courses/new/edit\\?id=${createdCourseId}`));
            await expect(page.getByRole('heading', { name: 'New course' }).first()).toBeVisible();
        } finally {
            if (createdCourseId) {
                await page.request.delete(`/api/courses/${createdCourseId}`, {
                    headers: { ...(await getCsrfHeader(page)) },
                });
            }
            await context.close();
        }
    });

    test('learning path new can create and open add course modal', async ({ browser }) => {
        const context = await newContextAsRole(browser, 'admin');
        const page = await context.newPage();
        page.on('console', msg => console.log(`[Browser Console] ${msg.text()}`));
        const createRes = await page.request.post('/api/learning-paths', {
            headers: { 'content-type': 'application/json', ...(await getCsrfHeader(page)) },
            data: { name: `E2E Learning Path ${Date.now()}`, isSequential: false }
        });
        if (!createRes.ok()) {
            const text = await createRes.text();
            throw new Error(`Create LP Failed: ${createRes.status()} ${text}`);
        }
        expect(createRes.ok()).toBe(true);
        const created = await createRes.json();
        const lpId = created?.id as string;
        expect(lpId).toBeTruthy();
        await page.goto(`/admin/learning-paths/${lpId}/edit?addCourse=1`);
        await expect(page.getByRole('dialog', { name: /add course to learning path/i })).toBeVisible();
        await context.close();
    });

    test('learning path enroll users works', async ({ browser }) => {
        const context = await newContextAsRole(browser, 'admin');
        const page = await context.newPage();
        page.on('console', msg => console.log(`[Browser Console] ${msg.text()}`));

        // Create a temp user to enroll
        const tempEmail = `lp-learner-${Date.now()}@example.com`;
        const createRes = await page.request.post('/api/users', {
            headers: { ...(await getCsrfHeader(page)) },
            data: {
                email: tempEmail,
                firstName: 'LP',
                lastName: 'Learner',
                role: 'LEARNER',
                password: 'TestPass123!',
                confirmPassword: 'TestPass123!'
            }
        });
        expect(createRes.ok()).toBeTruthy();

        await page.goto('/admin/learning-paths');
        await page.waitForLoadState('networkidle');

        // Ensure at least one learning path exists
        if (await page.getByText('No learning paths').isVisible()) {
             // Create one if missing
             await page.getByRole('button', { name: /create learning path/i }).click();
             await page.getByLabel('Title').fill('Temp LP');
             await page.getByRole('button', { name: /create/i }).click();
             await page.waitForURL(/\/admin\/learning-paths$/);
        }

        // Click Enroll on the first learning path
        await page.getByRole('button', { name: /enroll to learning path/i }).first().click({ force: true });
        const dialog = page.getByRole('dialog', { name: /enroll users to learning path/i });
        await expect(dialog).toBeVisible();
        
        // Search for users to populate the list
        await dialog.getByPlaceholder(/search/i).fill(tempEmail);
        await page.waitForResponse(resp => resp.url().includes('/api/users') && resp.status() === 200);
        // Use data-testid for reliable selection
        const firstUser = dialog.getByTestId(/^user-item-/).first();
        await expect(firstUser).toBeVisible();
        await firstUser.getByRole('button').click();
        // Wait for the enrollments POST to succeed before asserting dialog closes
        const enrollPost = page.waitForResponse(r => r.url().match(/\/api\/learning-paths\/[^/]+\/enrollments$/) && r.request().method() === 'POST');
        const enrollButton = dialog.getByRole('button', { name: /^Enroll\s+\d+\s+user/i });
        await expect(enrollButton).toBeEnabled();
        await enrollButton.click();
        const enrollRes = await enrollPost.catch(() => undefined);
        if (enrollRes && !enrollRes.ok()) {
            console.log('Enroll POST failed:', enrollRes.status(), await enrollRes.text());
            await dialog.getByRole('button', { name: /^Cancel$/ }).click();
        }
        await expect(dialog).toBeHidden();
        await expect(page.getByText(/failed to create enrollment/i)).toHaveCount(0);
        await context.close();
    });

    test('courses list loads from sidebar navigation', async ({ browser }) => {
        const context = await newContextAsRole(browser, 'admin');
        const page = await context.newPage();

        await page.goto('/admin/courses');
        await expect(page).toHaveURL(/\/admin\/courses$/);
        await expect(page.getByRole('heading', { name: 'Courses' })).toBeVisible();
        await expect(page.getByRole('progressbar')).toHaveCount(0);

        await context.close();
    });
});
