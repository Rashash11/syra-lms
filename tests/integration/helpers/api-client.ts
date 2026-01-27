import 'dotenv/config';
import { vi } from 'vitest';
import { signAccessToken } from '@/lib/auth-definitions';
import { PrismaClient } from '@prisma/client';

const dbUrl = process.env.DATABASE_URL_TEST || process.env.DATABASE_URL;
const prisma = new PrismaClient({
    datasources: dbUrl ? { db: { url: dbUrl } } : undefined,
});

export class ApiClient {
    private cookiesStore: Record<string, string> = {};

    constructor(initialCookies: Record<string, string> = {}) {
        this.cookiesStore = initialCookies;
    }

    setCookie(name: string, value: string) {
        this.cookiesStore[name] = value;
    }

    async fetch(
        url: string,
        options: {
            method?: string;
            body?: any;
            headers?: Record<string, string>;
            params?: any;
        } = {}
    ) {
        const { method = 'GET', body, headers = {} } = options;

        if (this.cookiesStore['csrf-token'] && !headers['x-csrf-token']) {
            headers['x-csrf-token'] = this.cookiesStore['csrf-token'];
        }

        console.log('ApiClient Request:', url, method, headers);

        const cookieString = Object.entries(this.cookiesStore)
            .map(([k, v]) => `${k}=${v}`)
            .join('; ');

        const finalHeaders = {
            ...headers,
            cookie: cookieString,
            ...(body ? { 'Content-Type': 'application/json' } : {}),
        };

        const response = await fetch(`http://localhost:3000${url}`, {
            method,
            headers: finalHeaders,
            body: body ? JSON.stringify(body) : undefined,
        });

        return response;
    }
}

/**
 * Helper to factory a logged-in client for a specific role/tenant
 */
export async function getAuthClient(role: any, tenantId: string, userId: string = 'test-user-id', email?: string) {
    const client = new ApiClient();

    // Debug JWT Secret
    const secret = process.env.JWT_SECRET || 'default';
    if (secret === 'default' || secret.startsWith('default_')) {
        console.warn('⚠️ WARNING: Using default JWT_SECRET in tests!');
    }

    const userEmail = email || `${role.toLowerCase()}@${tenantId}.com`;

    // Ensure Tenant Exists
    try {
        await prisma.tenant.upsert({
            where: { id: tenantId },
            update: {},
            create: { id: tenantId, name: 'Test Tenant', domain: `${tenantId}.test`, settings: {} }
        });

        // Ensure User Exists (for Guard check)
        await prisma.user.upsert({
            where: { id: userId },
            update: { activeRole: role }, // Ensure role matches
            create: {
                id: userId,
                tenantId,
                email: userEmail,
                username: `test_${role}_${userId.substring(0, 8)}`,
                firstName: 'Test',
                lastName: role,
                activeRole: role as any,
                status: 'ACTIVE',
                tokenVersion: 0
            }
        });
    } catch (e) {
        // Ignore unique constraint errors or connection issues during parallel tests
        console.warn('DB upsert failed in getAuthClient:', e);
    }

    // Generate a REAL signed JWT that will pass signature verification
    const token = await signAccessToken({
        userId,
        email: userEmail,
        activeRole: role as any,
        tenantId,
        tokenVersion: 0
    });
    console.log('Generated Token:', token);

    client.setCookie('session', token);
    client.setCookie('csrf-token', 'test-csrf-token'); // Default CSRF token
    return client;
}
