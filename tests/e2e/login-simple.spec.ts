import { test, expect } from '@playwright/test';

test('simple login test', async ({ page }) => {
    await page.goto('http://localhost:3001/login');
    await page.fill('input[name="email"]', 'admin-a@test.local');
    await page.fill('input[name="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');

    // Wait for navigation or check for dashboard
    await page.waitForURL('**/admin**', { timeout: 10000 });
    await expect(page).toHaveURL(/.*admin.*/);
});
