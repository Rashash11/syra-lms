import { prisma } from '@/lib/prisma';

let _cache: Record<string, Set<string>> = {};

export function clearPermissionCache(userId?: string) {
    if (userId) delete _cache[userId];
    else _cache = {};
}

export async function getUserPermissions(session: { userId: string; role?: string }) {
    const cacheKey = session.userId;
    if (_cache[cacheKey]) return _cache[cacheKey];
    const roleKey = session.role || 'LEARNER';
    const result = await (prisma as any).authRolePermission.findMany({
        where: { role: roleKey },
        include: { permission: true },
    });
    const perms = new Set<string>();
    for (const row of result || []) {
        const fp = row?.permission?.fullPermission;
        if (fp) perms.add(fp);
    }
    _cache[cacheKey] = perms;
    return perms;
}

export async function can(session: { userId: string; role?: string }, permission: string) {
    const perms = await getUserPermissions(session);
    return perms.has(permission);
}

