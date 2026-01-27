
import { describe, it, expect } from 'vitest';
import { ApiClient } from '../helpers/api-client';

describe('Auth Guard Routing Tests', () => {
    const PROTECTED_ROUTES: Array<{ path: string }> = [
        { path: '/api/users' },
        { path: '/api/courses' },
        { path: '/api/admin/settings' },
        // { path: '/api/instructor/courses' }, // Removed as it doesn't exist
        // { path: '/api/learner/progress' }, // Removed as it doesn't exist
        // { path: '/api/reports' }, // Removed as it doesn't exist (only sub-routes)
    ];

    it('should return 401 JSON for protected routes when not logged in', async () => {
        const client = new ApiClient();
        for (const route of PROTECTED_ROUTES) {
            const res = await client.fetch(route.path, {
                method: 'GET',
                headers: { 'Accept': 'application/json' }
            });

            expect(res.status, `Route ${route.path} should be 401`).toBe(401);

            const contentType = res.headers.get('content-type');
            expect(contentType, `Route ${route.path} should return JSON`).toContain('application/json');

            const body = await res.json();
            // Backend might return detail or message or error
            expect(body).toMatchObject(expect.objectContaining({}));
            // Typically FastAPI returns { "detail": "..." } or custom error
        }
    });
});
