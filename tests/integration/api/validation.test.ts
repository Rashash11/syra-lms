import { describe, it, expect } from 'vitest';
import { getAuthClient } from '../helpers/api-client';

function collectErrorMessages(payload: any): string[] {
    const out: string[] = [];

    // Check top-level message
    if (typeof payload?.message === 'string') {
        out.push(payload.message);
    }

    const container = payload?.errors ?? payload?.details ?? payload;
    if (Array.isArray(container)) {
        for (const e of container) {
            if (typeof e?.message === 'string') out.push(e.message);
            if (typeof e?.msg === 'string') out.push(e.msg); // Pydantic uses 'msg'
        }
    }
    const fieldErrors = container?.fieldErrors;
    if (fieldErrors && typeof fieldErrors === 'object') {
        for (const v of Object.values(fieldErrors)) {
            if (Array.isArray(v)) {
                for (const msg of v) {
                    if (typeof msg === 'string') out.push(msg);
                }
            }
        }
    }
    return out;
}

describe('API Validation (Zod)', () => {
    it('should reject course creation with missing title', async () => {
        const tenantId = '11111111-1111-1111-1111-111111111111';
        const client = await getAuthClient('ADMIN', tenantId);
        client.setCookie('csrf-token', 'token');

        const response = await client.fetch(
            '/api/courses',
            {
                method: 'POST',
                body: { description: 'Missing title' },
                headers: { 'x-csrf-token': 'token' }
            }
        );

        expect(response.status).toBe(422);
        const data = await response.json();
        console.log('Validation Response:', JSON.stringify(data));
        const messages = collectErrorMessages(data);
        expect(messages.some((m) => /required/i.test(m) || /title/i.test(m))).toBe(true);
    });

    it('should reject course creation with invalid UUID for categoryId', async () => {
        const tenantId = '11111111-1111-1111-1111-111111111111';
        const client = await getAuthClient('ADMIN', tenantId);
        client.setCookie('csrf-token', 'token');

        const response = await client.fetch(
            '/api/courses',
            {
                method: 'POST',
                body: {
                    title: 'Valid Title',
                    categoryId: 'not-a-uuid'
                },
                headers: { 'x-csrf-token': 'token' }
            }
        );

        // FastAPI returns 422 (Unprocessable Entity) for Pydantic validation errors
        expect(response.status).toBe(422);
        const data = await response.json();
        console.log('Validation Response (UUID):', JSON.stringify(data));
    });
});
