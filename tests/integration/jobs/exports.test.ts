import { describe, test, expect, vi, beforeAll } from 'vitest';
import { POST } from '@/app/api/reports/export/training-matrix/route';
import { jobs } from '@/lib/jobs/queues';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

// Mock the queueing system
vi.mock('@/lib/jobs/queues', async () => {
    const actual = await vi.importActual<typeof import('@/lib/jobs/queues')>('@/lib/jobs/queues');
    return {
        ...actual,
        jobs: {
            ...actual.jobs,
            report: {
                ...actual.jobs.report,
                export: vi.fn().mockResolvedValue({ id: 'mock-job-id' }),
            }
        }
    };
});

// Mock auth
vi.mock('@/lib/auth', () => ({
    verifyAccessTokenLight: vi.fn().mockResolvedValue({
        tenantId: 'default-tenant-id',
        userId: 'admin-user-id',
        role: 'ADMIN'
    })
}));

describe('Export Jobs (BullMQ)', () => {
    test('Training Matrix export should be queued (Async)', async () => {
        // Construct Mock Request
        const req = new NextRequest('http://localhost:3000/api/reports/export/training-matrix', {
            method: 'POST',
            body: JSON.stringify({ search: '', branchId: null, groupId: null }),
            headers: {
                cookie: 'session=mock-token'
            }
        });

        // Call Handler Directly
        const res = await POST(req);

        // Expect 202 Accepted
        expect(res.status).toBe(202);
        
        // Expect the job to have been added to the queue
        expect(jobs.report.export).toHaveBeenCalled();
        
        // Verify payload
        const callArgs = vi.mocked(jobs.report.export).mock.calls[0][0];
        expect(callArgs).toMatchObject({
            reportId: 'training-matrix',
            format: 'xlsx',
            tenantId: 'default-tenant-id',
            userId: 'admin-user-id'
        });
    });
});
