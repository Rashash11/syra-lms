import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';

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
    const BASE = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    // Login to get valid token from backend
    const loginRes = await fetch(`${BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: seed.learnerAEmail,
            password: 'TestPass123!'
        })
    });

    if (!loginRes.ok) {
        const text = await loginRes.text();
        throw new Error(`Login failed: ${loginRes.status} ${text}`);
    }

    const cookie = loginRes.headers.get('set-cookie');
    if (!cookie) throw new Error('No cookie received from login');

    // Test /api/me with the cookie
    const res = await fetch(`${BASE}/api/me`, {
        method: 'GET',
        headers: { 
            cookie: cookie,
            'csrf-token': 'learner-csrf' // Backend might not require csrf for GET, but good to have
        },
    });
    const body = await res.json().catch(() => ({}));
    assert(res.status === 200, `learner /api/me failed status=${res.status} body=${JSON.stringify(body).slice(0, 200)}`);
    process.stdout.write('OK\n');
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
