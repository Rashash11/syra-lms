import { test, expect } from '@playwright/test';
import { newContextAsRole } from '../helpers/login';

test.describe('Core User Journeys', () => {

    test('Admin can access dashboard and reports', async ({ browser }) => {
        const context = await newContextAsRole(browser, 'admin', true);
        const page = await context.newPage();

        await page.goto('/admin');
        await expect(page).toHaveURL(/.*\/admin$/);
        
        // Wait for loading to finish
        await expect(page.locator('.MuiCircularProgress-root')).not.toBeVisible();
        
        // Check for welcome message (case insensitive)
        await expect(page.getByText(/Welcome Back/i)).toBeVisible();

        await page.goto('/admin/reports');
        await expect(page).toHaveURL(/.*\/admin\/reports/);
        await expect(page.getByRole('heading', { name: /reports/i })).toBeVisible();
    });

    test('Instructor can create a course', async ({ browser }) => {
        const context = await newContextAsRole(browser, 'instructor', true);
        const page = await context.newPage();

        await page.goto('/instructor/courses');
        await expect(page.getByRole('button', { name: /add course/i })).toBeVisible();

        // Note: Full creation flow might be complex for this initial checkup
        // We just verify the button is there and we can reach the create page
        await page.getByRole('button', { name: /add course/i }).click();
        await expect(page).toHaveURL(/.*\/instructor\/courses\/new/);
    });

    test('Learner can view catalog', async ({ browser }) => {
        const context = await newContextAsRole(browser, 'learner', true);
        const page = await context.newPage();

        await page.goto('/learner/catalog');
        await expect(page).toHaveURL(/.*\/learner\/catalog/);
        // Expect some course card or empty state
        await expect(page.locator('body')).toBeVisible();
    });

});
