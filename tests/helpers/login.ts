import type { Browser, BrowserContext, Page } from '@playwright/test';
import * as fs from 'fs';
import { getStorageStatePath, TestRole } from '../e2e/helpers/auth';

const CREDENTIALS: Record<TestRole, { email: string; password: string }> = {
    admin: { email: 'admin-a@test.local', password: 'TestPass123!' },
    'super-instructor': { email: 'super-instructor-a@test.local', password: 'TestPass123!' },
    instructor: { email: 'instructor-a@test.local', password: 'TestPass123!' },
    learner: { email: 'learner-a@test.local', password: 'TestPass123!' },
    'learner-b': { email: 'learner-b@test.local', password: 'TestPass123!' },
    'admin-b': { email: 'admin-b@test.local', password: 'TestPass123!' },
};

async function loginViaUi(page: Page, role: TestRole) {
    const creds = CREDENTIALS[role] || CREDENTIALS.admin;
    await page.goto('/login');
    await page.locator('#email').fill(creds.email);
    await page.locator('#password').fill(creds.password);
    await page.getByRole('button', { name: 'Log in' }).click();
    await page.waitForLoadState('networkidle').catch(() => undefined);
    // Ensure we navigated away from login
    await page.waitForURL(url => !url.toString().includes('/login'), { timeout: 10000 }).catch(async () => {
        console.log('Login navigation wait timed out');
        const content = await page.content();
        const error = await page.getByRole('alert').textContent().catch(() => 'No alert found');
        console.log(`Login Error Alert: ${error}`);
    });
}

export async function newContextAsRole(browser: Browser, role: TestRole, forceFresh = false): Promise<BrowserContext> {
    const storagePath = getStorageStatePath(role);
    
    if (!forceFresh && fs.existsSync(storagePath)) {
        try {
            const context = await browser.newContext({ storageState: storagePath });
            const page = await context.newPage();
            await page.goto('/admin').catch(() => undefined);
            await page.waitForLoadState('networkidle').catch(() => undefined);
            if (!page.url().includes('/login')) {
                return context;
            }
            await context.close();
        } catch (e) {
            console.warn(`Failed to use storage state for ${role}, falling back to UI login`, e);
        }
    } else if (!forceFresh) {
        console.warn(`Storage state not found for ${role} at ${storagePath}, falling back to UI login`);
    }

    const context = await browser.newContext();
    const page = await context.newPage();
    await loginViaUi(page, role);
    await context.storageState({ path: storagePath });
    return context;
}
