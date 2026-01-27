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

    const BASE = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const res = await fetch(`${BASE}/api/certificates`, {
        method: 'GET',
        headers: { cookie: `session=${token}; csrf-token=cert-csrf` },
    });
    const body = await res.json().catch(() => ({}));
    assert(res.status === 200, `certificates unexpected status=${res.status} body=${JSON.stringify(body).slice(0, 200)}`);
    process.stdout.write('OK\n');
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
