import { Queue } from 'bullmq';

export const jobs = {
    report: {
        export: async (payload: any) => {
            const q = new Queue('reports');
            await (q as any).add('generate-report', payload);
            return { id: 'mock-job-id' };
        }
    }
};
