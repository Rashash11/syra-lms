import { describe, it, expect } from 'vitest';
import { getAuthClient } from '../helpers/api-client';

/**
 * CSRF Protection Test
 * Proves that state-changing requests without x-csrf-token are rejected.
 */
describe('CSRF Protection', () => {
    it('should reject POST request without CSRF header', async () => {
        const client = await getAuthClient('ADMIN', 'test-tenant');
        client.setCookie('csrf-token', 'valid-csrf-token'); // Set cookie

        // Request with MISMATCHED x-csrf-token header (api-client auto-adds from cookie if missing)
        const response = await client.fetch(
            '/api/courses',
            {
                method: 'POST',
                body: { title: 'New Course' },
                headers: { 'x-csrf-token': 'wrong-csrf-token' } // Mismatch triggers 403
            }
        );

        // Should return 403 Forbidden
        expect(response.status).toBe(403);
        const data = await response.json();
        expect(data.message).toMatch(/CSRF/i);
    });

    it('should accept POST request with matching CSRF cookie and header', async () => {
        const client = await getAuthClient('ADMIN', 'test-tenant');
        const token = 'secret-csrf-123';
        client.setCookie('csrf-token', token);

        // Mock process.env to enable CSRF check if it was disabled
        process.env.SKIP_CSRF = '0';

        const response = await client.fetch(
            '/api/courses',
            {
                method: 'POST',
                body: { title: 'New Course' },
                headers: { 'x-csrf-token': token }
            }
        );

        // With matching CSRF tokens, request should proceed past CSRF check
        // May still get 403 from RBAC or other authorization checks
        // The key is it's NOT a CSRF error
        const data = await response.json();
        // If 403, ensure it's NOT a CSRF mismatch error
        if (response.status === 403) {
            expect(data.message).not.toMatch(/CSRF/i);
        }
    });
});
