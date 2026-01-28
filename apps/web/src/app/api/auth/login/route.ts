import { NextRequest, NextResponse } from 'next/server';
import { signAccessToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  const backend = process.env.PYTHON_BACKEND_URL || 'http://localhost:8000';
  const url = new URL(request.url);
  const target = `${backend}/api/auth/login${url.search}`;
  const headers = new Headers(request.headers);
  headers.delete('host');
  headers.delete('connection');
  headers.delete('content-length');
  const rawCookie = headers.get('cookie') || '';
  const cookieList = cookies().getAll();
  const cookieHeader = rawCookie || cookieList.map(c => `${c.name}=${c.value}`).join('; ');
  if (cookieHeader) headers.set('cookie', cookieHeader);
  let textBody = '';
  try {
    textBody = await request.text();
  } catch {}
  try {
    const res = await fetch(target, {
      method: 'POST',
      headers,
      body: textBody || undefined,
      redirect: 'manual',
      cache: 'no-store',
    });
    if (res.status !== 502 && res.ok) {
      const data = await res.arrayBuffer();
      const responseHeaders = new Headers(res.headers);
      responseHeaders.delete('content-encoding');
      responseHeaders.delete('content-length');
      return new NextResponse(data, { status: res.status, headers: responseHeaders });
    }
  } catch (err) {
    console.error('[Login] Backend error:', err);
  }
  // Fallback to development mode with hardcoded credentials
  if (process.env.NODE_ENV !== 'production') {
    console.log('[Login] Using fallback development login');
    return NextResponse.json({ error: 'Backend unavailable - please use real backend' }, { status: 502 });
  }
  
  return NextResponse.json({ error: 'Backend unavailable' }, { status: 502 });
}

export const dynamic = 'force-dynamic';
