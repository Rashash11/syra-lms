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

async function callMe(seed: any, roleKey: string, includeTenantInJwt: boolean) {
    const roleMap: Record<string, { id: string; email: string }> = {
        ADMIN: { id: seed.adminAId, email: seed.adminAEmail },
        SUPER_INSTRUCTOR: { id: seed.superInstructorAId, email: seed.superInstructorAEmail },
        INSTRUCTOR: { id: seed.instructorAId, email: seed.instructorAEmail },
        LEARNER: { id: seed.learnerAId, email: seed.learnerAEmail },
    };

    const user = roleMap[roleKey];
    assert(user?.id && user?.email, `Missing fixture user for role ${roleKey}`);

    const token = await signAccessToken({
        userId: user.id,
        email: user.email,
        activeRole: roleKey as any,
        tenantId: includeTenantInJwt ? seed.tenantAId : undefined,
        nodeId: seed.nodeAId,
        tokenVersion: 0,
    });

    const res = await fetch('http://localhost:3000/api/me', {
        method: 'GET',
        headers: {
            cookie: `session=${token}; csrf-token=smoke-csrf`,
        },
    });

    const body = await res.json().catch(() => ({}));
    assert(res.status === 200, `/api/me failed for ${roleKey} (tenantInJwt=${includeTenantInJwt}) status=${res.status} body=${JSON.stringify(body).slice(0, 300)}`);
    // Backend does not return ok:true or claims, so we only check for user object
    assert(body?.user?.id === user.id, `/api/me user mismatch for ${roleKey}`);
}

async function main() {
    // Import here to ensure env vars are loaded
    const mod = await import('../apps/web/src/lib/auth-definitions');
    signAccessToken = mod.signAccessToken;

    const seed = readSeed();

    const healthRes = await fetch('http://localhost:3000/api/health');
    const health = await healthRes.json().catch(() => ({}));
    assert(healthRes.status === 200, `/api/health not healthy: status=${healthRes.status} body=${JSON.stringify(health).slice(0, 300)}`);

    await callMe(seed, 'ADMIN', true);
    await callMe(seed, 'SUPER_INSTRUCTOR', true);
    await callMe(seed, 'INSTRUCTOR', true);
    await callMe(seed, 'LEARNER', true);

    await callMe(seed, 'ADMIN', false);
    await callMe(seed, 'INSTRUCTOR', false);
    await callMe(seed, 'LEARNER', false);

    process.stdout.write('OK\n');
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
