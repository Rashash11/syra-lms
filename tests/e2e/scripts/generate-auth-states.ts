/**
 * Generate Auth Storage States
 * 
 * Creates Playwright storage state files for each test role using API login.
 * Run this after test:setup to prepare auth states.
 * 
 * Usage: npx tsx tests/e2e/scripts/generate-auth-states.ts
 */

import { request } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'node:child_process';
import dotenv from 'dotenv';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const PORT = new URL(BASE_URL).port || '3000';
const WEB_DIR = path.join(process.cwd(), 'apps', 'web');
const NEXT_BIN = path.join(process.cwd(), 'node_modules', 'next', 'dist', 'bin', 'next');
const STORAGE_DIR = path.join(__dirname, '../storage');
const FIXTURES_PATH = path.join(__dirname, '../fixtures/seed.json');

interface SeedFixtures {
    adminAEmail: string;
    superInstructorAEmail: string;
    instructorAEmail: string;
    learnerAEmail: string;
    learnerBEmail: string;
    adminBEmail: string;
    testPassword: string;
}

async function sleep(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
}

async function waitForHealthy(timeoutMs: number) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
        try {
            const res = await fetch(`${BASE_URL}/api/e2e/ready`, { method: 'GET' });
            if (res.ok) return true;
        } catch {
        }
        await sleep(500);
    }
    return false;
}

async function stopServer(server: ReturnType<typeof spawn> | null) {
    if (!server) return;
    if (server.exitCode !== null) return;

    const exited = new Promise<void>((resolve) => {
        server.once('exit', () => resolve());
        server.once('close', () => resolve());
    });

    try {
        server.kill();
        await Promise.race([exited, sleep(5000)]);
    } catch {
    }

    if (server.exitCode === null) {
        try {
            server.kill('SIGKILL');
        } catch {
        }
    }
}

function parseCookies(setCookieHeader: string, baseUrl: string): any[] {
    const url = new URL(baseUrl);
    const cookies: any[] = [];
    const cookieStrings = setCookieHeader.split(/,(?=\s*\w+=)/);
    for (const cookieStr of cookieStrings) {
        const parts = cookieStr.trim().split(';');
        const [nameValue, ...attributes] = parts;
        const [name, value] = nameValue.split('=');
        if (!name || !value) continue;
        const cookie: any = {
            name: name.trim(),
            value: value.trim(),
            domain: url.hostname,
            path: '/',
            httpOnly: false,
            secure: url.protocol === 'https:',
            sameSite: 'Lax',
        };
        for (const attr of attributes) {
            const [attrName, attrValue] = attr.trim().split('=');
            const lowerName = attrName.toLowerCase();
            if (lowerName === 'httponly') cookie.httpOnly = true;
            if (lowerName === 'secure') cookie.secure = true;
            if (lowerName === 'path') cookie.path = attrValue || '/';
            if (lowerName === 'domain') cookie.domain = attrValue || url.hostname;
            if (lowerName === 'samesite') {
                const v = (attrValue || 'Lax').trim().toLowerCase();
                cookie.sameSite = v === 'strict' ? 'Strict' : v === 'none' ? 'None' : 'Lax';
            }
            if (lowerName === 'expires') {
                cookie.expires = new Date(attrValue).getTime() / 1000;
            }
            if (lowerName === 'max-age') {
                cookie.expires = Date.now() / 1000 + parseInt(attrValue, 10);
            }
        }
        cookies.push(cookie);
    }
    return cookies;
}

async function generateAuthStates() {
    dotenv.config({ path: '.env.test' });
    dotenv.config({ path: '.env.local' });
    dotenv.config();

    if (!fs.existsSync(STORAGE_DIR)) {
        fs.mkdirSync(STORAGE_DIR, { recursive: true });
    }

    if (!fs.existsSync(FIXTURES_PATH)) {
        console.error('❌ Seed fixtures not found. Run "npm run test:setup" first.');
        process.exit(1);
    }

    const fixtures: SeedFixtures = JSON.parse(fs.readFileSync(FIXTURES_PATH, 'utf-8'));
    const roles = [
        { name: 'admin', email: fixtures.adminAEmail },
        { name: 'super-instructor', email: fixtures.superInstructorAEmail },
        { name: 'instructor', email: fixtures.instructorAEmail },
        { name: 'learner', email: fixtures.learnerAEmail },
        { name: 'learner-b', email: fixtures.learnerBEmail },
        { name: 'admin-b', email: fixtures.adminBEmail },
    ];

    console.log('🔐 Generating auth storage states...\n');

    let server: ReturnType<typeof spawn> | null = null;
    const healthy = await waitForHealthy(3000);
    if (!healthy) {
        const dbUrl = process.env.DATABASE_URL_TEST || process.env.DATABASE_URL;
        server = spawn(process.execPath, [NEXT_BIN, 'dev', '-p', PORT], {
            cwd: WEB_DIR,
            env: {
                ...process.env,
                PORT,
                ...(dbUrl ? { DATABASE_URL: dbUrl } : {}),
            },
            stdio: 'inherit',
        });
        const ok = await waitForHealthy(180_000);
        if (!ok) {
            await stopServer(server);
            throw new Error('Timed out waiting for /api/e2e/ready');
        }
    } else {
        console.log('   ℹ️  Using existing server at port ' + PORT);
    }

    const apiContext = await request.newContext({ baseURL: BASE_URL });
    let failures = 0;

    for (const { name, email } of roles) {
        console.log(`   Logging in as ${name} (${email})...`);
        try {
            const response = await apiContext.post('/api/auth/login', {
                data: { email, password: fixtures.testPassword },
            });
            if (!response.ok()) {
                console.error(`   ❌ Login failed for ${name}: ${response.status()}`);
                failures += 1;
                continue;
            }
            const setCookie = response.headers()['set-cookie'] || '';
            const storageState = {
                cookies: setCookie ? parseCookies(setCookie, BASE_URL) : [],
                origins: [],
            };
            const storagePath = path.join(STORAGE_DIR, `${name}.json`);
            fs.writeFileSync(storagePath, JSON.stringify(storageState, null, 2));
            console.log(`   ✅ Saved: ${storagePath}`);
        } catch (error: any) {
            console.error(`   ❌ Failed for ${name}: ${error.message}`);
            failures += 1;
        }
    }

    await apiContext.dispose();
    await stopServer(server);

    if (failures > 0) {
        throw new Error(`Failed to generate ${failures} storage state(s)`);
    }

    console.log('\n✅ Auth storage states generated!');
    console.log(`   Location: ${STORAGE_DIR}`);
}

generateAuthStates().catch((error) => {
    console.error('Failed to generate auth states:', error);
    process.exit(1);
});
