import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'default_secret_key_change_me');

interface TokenPayload {
  userId: string;
  activeRole?: string;
  role?: string;
  exp?: number;
  iat?: number;
  [key: string]: any;
}

async function getTokenPayload(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as TokenPayload;
  } catch {
    return null;
  }
}

async function getRole(req: NextRequest): Promise<string | null> {
  const token = req.cookies.get('session')?.value || '';
  if (!token) return null;
  
  const payload = await getTokenPayload(token);
  return payload?.activeRole || payload?.role || null;
}

async function shouldRefreshToken(token: string): Promise<boolean> {
  const payload = await getTokenPayload(token);
  if (!payload || !payload.exp) return false;
  
  const now = Math.floor(Date.now() / 1000);
  const expiresIn = payload.exp - now;
  
  // Refresh if token expires in less than 5 minutes
  return expiresIn < 5 * 60;
}

async function refreshTokens(req: NextRequest): Promise<{ session?: string; refreshToken?: string } | null> {
  try {
    const refreshToken = req.cookies.get('refreshToken')?.value;
    if (!refreshToken) return null;

    // Call the refresh endpoint
    const baseUrl = req.nextUrl.origin;
    const response = await fetch(`${baseUrl}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        'Cookie': `refreshToken=${refreshToken}`,
      },
    });

    if (!response.ok) return null;

    // Extract new tokens from Set-Cookie headers
    const setCookieHeaders = response.headers.getSetCookie();
    const tokens: { session?: string; refreshToken?: string } = {};

    for (const cookie of setCookieHeaders) {
      if (cookie.startsWith('session=')) {
        const match = cookie.match(/session=([^;]+)/);
        if (match) tokens.session = match[1];
      } else if (cookie.startsWith('refreshToken=')) {
        const match = cookie.match(/refreshToken=([^;]+)/);
        if (match) tokens.refreshToken = match[1];
      }
    }

    return tokens;
  } catch (error) {
    console.error('[Middleware] Token refresh failed:', error);
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const pathname = url.pathname;
  
  // Check if we need to refresh the token
  const sessionToken = req.cookies.get('session')?.value;
  let response = NextResponse.next();
  
  if (sessionToken && await shouldRefreshToken(sessionToken)) {
    const newTokens = await refreshTokens(req);
    
    if (newTokens?.session && newTokens?.refreshToken) {
      // Create a new response with updated cookies
      response = NextResponse.next();
      
      response.cookies.set('session', newTokens.session, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 15 * 60, // 15 minutes
        path: '/',
      });
      
      response.cookies.set('refreshToken', newTokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60, // 7 days
        path: '/',
      });
    }
  }
  
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
  
  const session = req.cookies.get('session')?.value;
  if (session) {
    response.headers.set('x-session', session);
  }
  
  return response;
}

export const config = {
  matcher: ['/admin', '/admin/:path*', '/instructor', '/instructor/:path*', '/super-instructor', '/super-instructor/:path*', '/learner', '/learner/:path*', '/superadmin', '/superadmin/:path*'],
};
