export const prisma: any = {
    $queryRaw: async (..._args: any[]) => [],
    user: {
        findUnique: async (_args: any) => null,
        update: async (_args: any) => ({}),
        upsert: async (_args: any) => ({}),
    },
    userRole: {
        upsert: async (_args: any) => ({}),
    },
    tenant: {
        upsert: async (_args: any) => ({}),
    },
    course: {
        upsert: async (_args: any) => ({}),
    },
    authRolePermission: {
        findMany: async (_args: any) => [],
    },
    authRole: {
        findFirst: async (_args: any) => null,
    },
    reportExport: {
        deleteMany: async (_args?: any) => ({}),
        create: async (args: any) => args?.data || {},
        findUnique: async (args: any) => ({ id: args?.where?.id, status: 'QUEUED' }),
    },
};
