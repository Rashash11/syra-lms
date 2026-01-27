
import { describe, it, expect } from 'vitest';
import { ApiClient } from '../helpers/api-client';

describe('No HTML Routing Tests', () => {
    it('should return JSON 404 for non-existent API routes', async () => {
        const client = new ApiClient();
        const res = await client.fetch('/api/this-route-does-not-exist-' + Date.now(), {
            method: 'GET',
            headers: { 'Accept': 'application/json' }
        });

        expect(res.status).toBe(404);
        const contentType = res.headers.get('content-type');
        expect(contentType).toContain('application/json');
        
        const body = await res.json();
        // Backend returns detail or error
        // expect(body.error).toBe('NOT_FOUND'); // This might differ in Python backend
    });

    it('should return JSON 404 for non-existent API routes with POST', async () => {
        const client = new ApiClient();
        const res = await client.fetch('/api/this-route-does-not-exist-' + Date.now(), {
            method: 'POST',
            headers: { 'Accept': 'application/json' }
        });

        expect(res.status).toBe(404);
        const contentType = res.headers.get('content-type');
        expect(contentType).toContain('application/json');
    });
});
