import { describe, test, expect, beforeAll } from 'vitest';
import { prisma } from '@/lib/prisma';
import { getAuthClient } from '../helpers/api-client';

// Define Test Data IDs (Valid UUIDs)
const TENANT_A = '55555555-5555-5555-5555-555555555555';
const TENANT_B = '66666666-6666-6666-6666-666666666666';
const USER_A_ADMIN = '77777777-7777-7777-7777-777777777777';
const USER_B_ADMIN = '88888888-8888-8888-8888-888888888888';
const COURSE_B = '99999999-9999-9999-9999-999999999999';
const USER_B_TARGET = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

describe('Security: Tenant Isolation', () => {
    beforeAll(async () => {
        // Setup Tenants
        await prisma.tenant.upsert({ where: { id: TENANT_A }, update: {}, create: { id: TENANT_A, name: 'Tenant A', domain: 'sec-a.test', settings: {} } });
        await prisma.tenant.upsert({ where: { id: TENANT_B }, update: {}, create: { id: TENANT_B, name: 'Tenant B', domain: 'sec-b.test', settings: {} } });

        // Setup Users
        await prisma.user.upsert({ where: { id: USER_A_ADMIN }, update: {}, create: { id: USER_A_ADMIN, tenantId: TENANT_A, email: 'admin@sec-a.test', username: 'admin_sec_a', firstName: 'A', lastName: 'Admin', activeRole: 'ADMIN', status: 'ACTIVE' } });
        await prisma.user.upsert({ where: { id: USER_B_ADMIN }, update: {}, create: { id: USER_B_ADMIN, tenantId: TENANT_B, email: 'admin@sec-b.test', username: 'admin_sec_b', firstName: 'B', lastName: 'Admin', activeRole: 'ADMIN', status: 'ACTIVE' } });
        await prisma.user.upsert({ where: { id: USER_B_TARGET }, update: {}, create: { id: USER_B_TARGET, tenantId: TENANT_B, email: 'target@sec-b.test', username: 'target_sec_b', firstName: 'B', lastName: 'Target', activeRole: 'LEARNER', status: 'ACTIVE' } });

        // Setup Course in Tenant B
        await prisma.course.upsert({
            where: { id: COURSE_B },
            update: {},
            create: { id: COURSE_B, tenantId: TENANT_B, code: 'SEC-B-101', title: 'Secret B Course', status: 'PUBLISHED' }
        });
    });

    test('Admin A cannot READ Course from Tenant B (404)', async () => {
        const client = await getAuthClient('ADMIN', TENANT_A, USER_A_ADMIN);
        const res = await client.fetch(`/api/courses/${COURSE_B}`, { params: { id: COURSE_B } });
        // Course backend properly returns 404 for cross-tenant reads (better security)
        expect(res.status).toBe(404);
    });

    test('Admin A cannot UPDATE Course from Tenant B (404)', async () => {
        const client = await getAuthClient('ADMIN', TENANT_A, USER_A_ADMIN);
        const res = await client.fetch(`/api/courses/${COURSE_B}`, {
            method: 'PUT',
            params: { id: COURSE_B },
            body: { title: 'Hacked' }
        });
        // Cross-tenant access returns 404 (Not Found) - superior security
        expect(res.status).toBe(404);
    });

    test('Admin A cannot READ User from Tenant B (404)', async () => {
        const client = await getAuthClient('ADMIN', TENANT_A, USER_A_ADMIN);
        const res = await client.fetch(`/api/users/${USER_B_TARGET}`, { params: { id: USER_B_TARGET } });
        // Cross-tenant access returns 404 (Not Found) - superior security
        expect(res.status).toBe(404);
    });
});
