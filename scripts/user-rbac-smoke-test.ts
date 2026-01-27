import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });
dotenv.config({ path: '.env.local' });
dotenv.config();

let signAccessToken: any;

function assert(condition: unknown, message: string) {
    if (!condition) throw new Error(message);
}

function readSeed() {
    const seedPath = path.join(process.cwd(), 'tests', 'e2e', 'fixtures', 'seed.json');
    const raw = fs.readFileSync(seedPath, 'utf-8');
    return JSON.parse(raw) as any;
}

async function callAdminRoles(seed: any, roleKey: 'ADMIN' | 'INSTRUCTOR' | 'LEARNER') {
    const userByRole: Record<string, { id: string; email: string }> = {
        ADMIN: { id: seed.adminAId, email: seed.adminAEmail },
        INSTRUCTOR: { id: seed.instructorAId, email: seed.instructorAEmail },
        LEARNER: { id: seed.learnerAId, email: seed.learnerAEmail },
    };
    const expected: Record<string, number> = { ADMIN: 200, INSTRUCTOR: 403, LEARNER: 403 };

    const user = userByRole[roleKey];
    const token = await signAccessToken({
        userId: user.id,
        email: user.email,
        activeRole: roleKey as any,
        role: roleKey,
        tenantId: seed.tenantAId,
        nodeId: seed.nodeAId,
        tokenVersion: 0,
    });

    const res = await fetch('http://localhost:3000/api/admin/roles', {
        method: 'GET',
        headers: {
            cookie: `session=${token}; csrf-token=rbac-csrf`,
        },
    });

    const body = await res.json().catch(() => ({}));
    assert(res.status === expected[roleKey], `roles check failed role=${roleKey} status=${res.status} body=${JSON.stringify(body).slice(0, 200)}`);
}

async function main() {
    const mod = await import('../apps/web/src/lib/auth-definitions');
    signAccessToken = mod.signAccessToken;

    const seed = readSeed();
    await callAdminRoles(seed, 'ADMIN');
    await callAdminRoles(seed, 'INSTRUCTOR');
    await callAdminRoles(seed, 'LEARNER');
    process.stdout.write('OK\n');
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
