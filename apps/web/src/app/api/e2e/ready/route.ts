import { NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';

export async function GET() {
    const readyPath = path.join(process.cwd(), 'apps', 'web', '.e2e-ready');
    let readyAt: string | null = null;
    try {
        if (fs.existsSync(readyPath)) {
            readyAt = fs.readFileSync(readyPath, 'utf-8');
        }
    } catch {
    }
    return NextResponse.json({ ok: true, readyAt });
}

export const dynamic = 'force-dynamic';
