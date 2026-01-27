import { expect, Page } from '@playwright/test';
import { test } from './e2eTest';
import { newContextAsRole } from '../helpers/login';
import { loadE2ESeedFixtures } from '../helpers/seed';

const fixtures = loadE2ESeedFixtures();

async function getCsrfHeader(page: { context: () => any }) {
    const csrfToken = (await page.context().cookies()).find((c: any) => c.name === 'csrf-token')?.value;
    return csrfToken ? { 'x-csrf-token': csrfToken } : {};
}

async function loginAs(page: Page, email: string, pass: string) {
    console.log(`Attempting login for ${email}`);
    await page.goto('/login');

    // Monitor network response for login
    const loginResponsePromise = page.waitForResponse(response =>
        response.url().includes('/api/auth/login') && response.request().method() === 'POST'
    );

    await page.locator('input[type="email"]').fill(email);
    await page.locator('input[type="password"]').fill(pass);
    await page.getByRole('button', { name: /Log in/i }).click();

    try {
        const response = await loginResponsePromise;
        console.log(`Login API Status: ${response.status()}`);
        console.log(`Login API Body: ${await response.text()}`);
    } catch (e) {
        console.log('Login API request not captured or timed out');
    }

    await page.waitForTimeout(2000);
    console.log(`Page URL after login: ${page.url()}`);

    if (page.url().includes('/login')) {
        // Check for error message
        const error = await page.getByRole('alert').textContent().catch(() => 'No alert found');
        console.log(`Login Error on Page: ${error}`);
    }
}

test.describe('Learning Cycle E2E', () => {
    test.describe.configure({ mode: 'serial' });

    test('Admin can enroll learner to course and learner sees it', async ({ browser }) => {
        try {
            // 1. Login as Admin
            console.log('Logging in as Admin (Manual)...');
            const adminContext = await browser.newContext();
            const adminPage = await adminContext.newPage();

            await loginAs(adminPage, fixtures.adminAEmail, fixtures.testPassword);

            // Navigate to courses
            console.log('Navigating to /admin/courses...');
            await adminPage.goto('/admin/courses');
            console.log('Current URL:', adminPage.url());

            // Wait for reliable element on courses page
            await expect(adminPage.getByTestId('admin-cta-add-course')).toBeVisible({ timeout: 15000 });

            // Find and edit "Test Course A" (from seed)
            console.log('Searching for course "Test Course A"...');
            await adminPage.getByTestId('courses-search-input').fill('Test Course A');
            await adminPage.waitForTimeout(2000); // Increased wait

            console.log('Clicking course title...');
            // Click the title text to navigate
            await adminPage.getByRole('row', { name: /Test Course A/i })
                .getByText('Test Course A')
                .click();
            
            // Wait for navigation
            await adminPage.waitForURL(/\/admin\/courses\/[a-z0-9-]+/);

            // Wait for course editor/details
            // The editor usually has "Course Settings" or "Outline" text
            console.log('Waiting for course editor...');
            await expect(adminPage.getByTestId('sidebar-users-btn')).toBeVisible({ timeout: 15000 });

            // Ensure course is published
            console.log('Ensuring course is published...');
            await adminPage.request.put(`/api/courses/${fixtures.courseAId}`, {
                headers: await getCsrfHeader(adminPage),
                data: { status: 'PUBLISHED' }
            });

            // 2. Enroll Learner
            console.log('Opening Users/Enrollment drawer... (getByTestId)');

            // Create a temporary user for this test to avoid enrollment conflicts
            const tempEmail = `learner-${Date.now()}@example.com`;
            console.log(`Creating temp user ${tempEmail}...`);
            const createRes = await adminPage.request.post('/api/users', {
                headers: await getCsrfHeader(adminPage),
                data: {
                    email: tempEmail,
                    firstName: 'Temp',
                    lastName: 'Learner',
                    role: 'LEARNER',
                    password: fixtures.testPassword,
                    confirmPassword: fixtures.testPassword
                }
            });
            if (!createRes.ok()) {
                console.log(`Failed to create temp user: ${await createRes.text()}`);
                throw new Error('User creation failed');
            }
            const tempUser = await createRes.json();
            const tempUserId = tempUser.id;
            console.log(`Created temp user ${tempUserId} in tenant ${tempUser.tenantId}`);

            try {
                const usersBtn = adminPage.getByTestId('sidebar-users-btn');
                await expect(usersBtn).toBeVisible({ timeout: 5000 });
                await usersBtn.click();
            } catch (e) {
                console.log('Users button not found. Dumping Body HTML...');
                const js = await adminPage.evaluate(() => document.body.innerHTML);
                console.log(js.substring(0, 2000)); // Log first 2000 chars (sidebar is usually early)

                // Try finding ANY button in the sidebar
                const buttons = await adminPage.locator('button').all();
                console.log(`Found ${buttons.length} buttons on page.`);
                for (const b of buttons) {
                    console.log(`Button: ${await b.textContent()} | Label: ${await b.getAttribute('aria-label')} | TestId: ${await b.getAttribute('data-testid')}`);
                }
                throw e;
            }

            console.log('Clicking Enroll Users button...');
            const enrollBtnDialog = adminPage.getByRole('button', { name: 'Enroll Users' });
            await expect(enrollBtnDialog).toBeVisible();
            await enrollBtnDialog.click();

            console.log('Searching for learner "SuperInstructor"...');
            // The dialog input has placeholder "Search and select users..."
            const searchInput = adminPage.getByPlaceholder('Search and select users...');
            await expect(searchInput).toBeVisible();

            const searchResponsePromise = adminPage.waitForResponse(r => 
                r.url().includes('/api/users') && r.request().method() === 'GET'
            );

            // Search by first name to avoid email encoding issues
            await searchInput.fill('Temp');
            
            try {
                const searchRes = await searchResponsePromise;
                console.log(`Captured Request URL: ${searchRes.url()}`);
                console.log(`Search API Status: ${searchRes.status()}`);
                console.log(`Search API Body: ${await searchRes.text()}`);
            } catch (e) {
                console.log('Search API request not captured or timed out');
            }

            await adminPage.waitForTimeout(1000); // Wait for UI update

            console.log('Selecting learner...');
            // Select by email which should be visible in the row
            const userRow = adminPage.locator('li[role="button"]').filter({ hasText: tempEmail }).first();
            
            // Debug: log visible text if not found
            if (!await userRow.isVisible()) {
                console.log('User row not found. Visible content in dialog:');
                const dialog = adminPage.getByRole('dialog');
                console.log(await dialog.textContent());
            }

            await expect(userRow).toBeVisible();
            // Try clicking the checkbox if available, otherwise the row
            const checkbox = userRow.getByRole('checkbox').first();
            if (await checkbox.count() > 0) {
                 await checkbox.click({ force: true });
            } else {
                 await userRow.click({ force: true });
            }

            console.log('Submitting enrollment...');
            
            // Target the Modal specifically (MuiDialog), not the Drawer
            const enrollModal = adminPage.locator('.MuiDialog-paper[role="dialog"]');
            await expect(enrollModal).toBeVisible();
            
            const submitEnroll = enrollModal.getByRole('button', { name: /^Enroll/i });
            await expect(submitEnroll).toBeEnabled();
            await submitEnroll.click();
            
            console.log('Verifying dialog closes...');
            await expect(enrollModal).toBeHidden();

            console.log('Verifying enrollment list...');
            // Reload to ensure list is updated
            await adminPage.reload();
            
            // Re-open drawer
            console.log('Re-opening Users/Enrollment drawer...');
            const usersBtn = adminPage.getByTestId('sidebar-users-btn');
            await expect(usersBtn).toBeVisible();
            await usersBtn.click();
            
            // Wait for drawer animation and data fetch
            await adminPage.waitForTimeout(2000);
            
            // Check for row in table
            await expect(adminPage.getByRole('row', { name: tempEmail })).toBeVisible();

            await adminContext.close();

            // 3. Learner Verification
            console.log('Logging in as Learner (super-instructor-a)...');
            const learnerContext = await browser.newContext();
            const learnerPage = await learnerContext.newPage();

            await loginAs(learnerPage, tempEmail, fixtures.testPassword);

            console.log('Navigating to My Courses...');
            
            // Debug: Check /api/me and /api/learner/enrollments
            const mePromise = learnerPage.waitForResponse(r => r.url().includes('/api/me'));
            const enrollmentsPromise = learnerPage.waitForResponse(r => r.url().includes('/api/learner/enrollments'));
            
            await learnerPage.goto('/learner/my-courses');
            
            try {
                const meRes = await mePromise;
                console.log('Learner /api/me:', await meRes.text());
                
                const enrRes = await enrollmentsPromise;
                console.log('Learner Enrollments:', await enrRes.text());
            } catch (e) {
                console.log('Failed to capture learner API responses');
            }

            console.log('Verifying course visibility...');
            try {
                await expect(learnerPage.locator('text=Test Course A')).toBeVisible({ timeout: 5000 });
            } catch (e) {
                console.log('Course not visible. reloading...');
                await learnerPage.reload();
                try {
                    await expect(learnerPage.locator('text=Test Course A')).toBeVisible({ timeout: 5000 });
                } catch (e2) {
                    console.log('Course still not visible. Page text:');
                    const text = await learnerPage.evaluate(() => document.body.innerText);
                    console.log(text);
                    throw e2;
                }
            }

            console.log('Success!');
            await learnerContext.close();
        } catch (e: any) {
            console.error('Test Failed:', e);
            const fs = require('fs');
            fs.writeFileSync('error.txt', e.toString() + "\n" + (e.stack || ''));
            throw e;
        }
    });
});
