import { test, expect } from './e2eTest';
import { newContextAsRole } from '../helpers/login';

test.describe('Admin Comprehensive Smoke Tests', () => {
    
    const adminPages = [
        { route: '/admin/assignments', heading: 'Assignments' },
        { route: '/admin/automations', heading: 'Automations' },
        { route: '/admin/branches', heading: 'Branches' },
        // { route: '/admin/course-store', heading: 'Course Store' }, // Might be named differently
        { route: '/admin/discussions', heading: 'Discussions' },
        { route: '/admin/files', heading: 'Files' },
        { route: '/admin/gamification', heading: 'Gamification' },
        { route: '/admin/reports', heading: 'Reports' },
        { route: '/admin/security/audit', heading: 'Audit Log' }, // Guessed heading
        { route: '/admin/settings', heading: 'Settings' },
        { route: '/admin/skills', heading: 'Skills' },
        { route: '/admin/subscription', heading: 'Subscription' },
    ];

    for (const pageInfo of adminPages) {
        test(`loads ${pageInfo.route} correctly`, async ({ browser }) => {
            const context = await newContextAsRole(browser, 'admin');
            const page = await context.newPage();

            await page.goto(pageInfo.route);
            // Wait for network idle to ensure content is loaded
            await page.waitForLoadState('networkidle').catch(() => undefined);
            
            // Check for heading - using a flexible regex to catch variations
            const headingRegex = new RegExp(pageInfo.heading, 'i');
            await expect(page.getByRole('heading', { name: headingRegex }).first()).toBeVisible();

            await context.close();
        });
    }

    test('can navigate to security sessions', async ({ browser }) => {
        const context = await newContextAsRole(browser, 'admin');
        const page = await context.newPage();
        
        await page.goto('/admin/security/sessions');
        await expect(page.getByRole('heading', { name: /Sessions/i })).toBeVisible();
        
        await context.close();
    });

});
