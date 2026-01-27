import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

async function getRole(req: NextRequest): Promise<string | null> {
  const token = req.cookies.get('session')?.value || '';
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length === 3) {
      let b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const pad = b64.length % 4;
      if (pad) b64 += '='.repeat(4 - pad);
      const decoded =
        typeof (globalThis as any).atob === 'function'
          ? (globalThis as any).atob(b64)
          : Buffer.from(b64, 'base64').toString('utf8');
      const json = JSON.parse(decoded);
      return json?.activeRole || json?.role || null;
    }
  } catch {}
  return null;
}

export async function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const pathname = url.pathname;
  const role = await getRole(req);

  if (pathname.startsWith('/admin') || pathname.startsWith('/superadmin')) {
    if (role !== 'ADMIN') {
      url.pathname = '/login';
      const res = NextResponse.redirect(url);
      const session = req.cookies.get('session')?.value;
      if (session) {
        res.headers.set('x-session', session);
      }
      return res;
    }
  }
  if (pathname.startsWith('/super-instructor')) {
    if (role !== 'SUPER_INSTRUCTOR' && role !== 'ADMIN') {
      url.pathname = '/login';
      const res = NextResponse.redirect(url);
      const session = req.cookies.get('session')?.value;
      if (session) {
        res.headers.set('x-session', session);
      }
      return res;
    }
  }
  if (pathname.startsWith('/instructor')) {
    if (role !== 'INSTRUCTOR' && role !== 'SUPER_INSTRUCTOR' && role !== 'ADMIN') {
      url.pathname = '/login';
      const res = NextResponse.redirect(url);
      const session = req.cookies.get('session')?.value;
      if (session) {
        res.headers.set('x-session', session);
      }
      return res;
    }
  }
  const res = NextResponse.next();
  const session = req.cookies.get('session')?.value;
  if (session) {
    res.headers.set('x-session', session);
  }
  return res;
}

export const config = {
  matcher: ['/admin', '/admin/:path*', '/instructor', '/instructor/:path*', '/super-instructor', '/super-instructor/:path*', '/learner', '/learner/:path*', '/superadmin', '/superadmin/:path*'],
};
