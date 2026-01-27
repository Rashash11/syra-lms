import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import { signAccessToken } from '../apps/web/src/lib/auth';

dotenv.config({ path: '.env.test' });
dotenv.config({ path: '.env.local' });
dotenv.config();

function assert(condition: unknown, message: string) {
    if (!condition) throw new Error(message);
}

function readSeed() {
    const seedPath = path.join(process.cwd(), 'tests', 'e2e', 'fixtures', 'seed.json');
    const raw = fs.readFileSync(seedPath, 'utf-8');
    return JSON.parse(raw) as any;
}

async function callJson(label: string, url: string, cookie: string) {
    const res = await fetch(url, { headers: { cookie }, cache: 'no-store' });
    const json = await res.json().catch(() => ({}));
    return { label, status: res.status, json };
}

async function main() {
    const seed = readSeed();
    const token = await signAccessToken({
        userId: seed.adminAId,
        email: seed.adminAEmail,
        activeRole: 'ADMIN',
        tenantId: seed.tenantAId,
        nodeId: seed.nodeAId,
        tokenVersion: 0,
    });

    const cookie = `session=${token}; csrf-token=diag-csrf`;
    const BASE = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    const health = await callJson('/api/e2e/ready', `${BASE}/api/e2e/ready`, cookie);
    assert(health.status === 200, `/api/e2e/ready failed: status=${health.status} body=${JSON.stringify(health.json).slice(0, 300)}`);

    const checks = await Promise.all([
        callJson('/api/me', `${BASE}/api/me`, cookie),
        callJson('/api/dashboard', `${BASE}/api/dashboard`, cookie),
        callJson('/api/users', `${BASE}/api/users`, cookie),
        callJson('/api/courses', `${BASE}/api/courses`, cookie),
        callJson('/api/learning-paths', `${BASE}/api/learning-paths`, cookie),
    ]);

    for (const c of checks) {
        assert(c.status === 200, `${c.label} failed: status=${c.status} body=${JSON.stringify(c.json).slice(0, 300)}`);
    }

    process.stdout.write('OK\n');
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
