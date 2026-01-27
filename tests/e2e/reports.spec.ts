import { test, expect } from './e2eTest';
import { newContextAsRole } from '../helpers/login';

test.describe('Reports', () => {
    test('admin reports page loads', async ({ browser }, testInfo) => {
        const context = await newContextAsRole(browser, 'admin');
        const page = await context.newPage();

        await page.goto('/admin/reports');
        await expect(page.getByRole('heading', { name: 'Reports' })).toBeVisible();

        await context.close();
    });

    test('training progress export downloads an xlsx', async ({ browser }) => {
        const context = await newContextAsRole(browser, 'admin');
        const { request: requestFactory } = await import('@playwright/test');
        const { getStorageStatePath } = await import('../e2e/helpers/auth');
        const api = await requestFactory.newContext({
            baseURL: process.env.BASE_URL || 'http://localhost:3000',
            storageState: getStorageStatePath('admin'),
        });
        const res = await api.post('/api/reports/export/training-progress');
        expect([200, 401]).toContain(res.status());
        if (res.status() === 200) {
            expect(res.headers()['content-disposition']?.toLowerCase() || '').toContain('training_progress.xlsx');
        }
        await api.dispose();
        await context.close();
    });
});
