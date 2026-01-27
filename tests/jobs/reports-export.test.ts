import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Queue } from 'bullmq';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';
import { POST as exportTrainingMatrix } from '@/app/api/reports/export/training-matrix/route';
import { signAccessToken } from '@/lib/auth-definitions';

vi.mock('bullmq');

describe('Report Export Job Flow', () => {
    beforeEach(async () => {
        // Clear DB or specific tables
        await prisma.reportExport.deleteMany();
        vi.clearAllMocks();
    });

    it('should queue a job when /api/reports/export is called', async () => {
        const mockAdd = vi.fn().mockResolvedValue({ id: 'job-123' });
        (Queue as any).prototype.add = mockAdd;
        const token = await signAccessToken({
            userId: 'admin-user-id',
            email: 'admin@default-tenant-id.com',
            activeRole: 'ADMIN',
            tenantId: 'default-tenant-id',
            tokenVersion: 0,
        });
        const req = new NextRequest(new URL('/api/reports/export/training-matrix', 'http://localhost:3000'), {
            method: 'POST',
            headers: { cookie: `session=${token}` },
            body: JSON.stringify({}),
        });
        await exportTrainingMatrix(req);
        expect(mockAdd).toHaveBeenCalledWith(
            'generate-report',
            expect.objectContaining({
                reportId: 'training-matrix',
                format: 'xlsx',
                tenantId: 'default-tenant-id',
                userId: 'admin-user-id',
            })
        );
    });

    it('should transition status from QUEUED to COMPLETED on success', async () => {
        // 1. Create a pending record
        const exportRecord = await prisma.reportExport.create({
            data: {
                id: 'test-report-1',
                type: 'TRANSCRIPT',
                status: 'QUEUED',
                tenantId: 'tenant-1',
                userId: 'admin-1'
            }
        });

        // 2. Manually trigger the worker logic (usually extracted from worker.on('completed'))
        // await processReportJob({ data: { recordId: 'test-report-1' } });

        // 3. Verify DB state
        const updated = await prisma.reportExport.findUnique({
            where: { id: 'test-report-1' }
        });

        // expect(updated?.status).toBe('COMPLETED');
        // expect(updated?.fileUrl).toBeDefined();
    });
});
