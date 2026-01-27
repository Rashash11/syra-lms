import { NextRequest, NextResponse } from 'next/server';

const backend = process.env.PYTHON_BACKEND_URL || 'http://localhost:8001';

export async function GET(req: NextRequest) {
  const res = await fetch(`${backend}/api/auth/me`, {
    method: 'GET',
    headers: {
      cookie: req.headers.get('cookie') || '',
    },
  });
  const data = await res.text();
  const ct = res.headers.get('content-type') || 'application/json';
  return new NextResponse(data, { status: res.status, headers: { 'content-type': ct } });
}

export const dynamic = 'force-dynamic';
