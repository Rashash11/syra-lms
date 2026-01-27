import { SignJWT, jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'default_secret_key_change_me');
const ISSUER = 'lms-auth';
const AUDIENCE = 'lms-api';

export class AuthError extends Error { }

export interface CustomJWTPayload {
    userId: string;
    tokenVersion: number;
    tenantId?: string;
    [key: string]: any;
}

export async function signAccessToken(payload: Record<string, any>) {
    const token = await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('15m')
        .setIssuer(ISSUER)
        .setAudience(AUDIENCE)
        .sign(JWT_SECRET);
    return token;
}

export async function verifyAccessTokenLight(token: string) {
    try {
        const { payload } = await jwtVerify(token, JWT_SECRET, {
            issuer: ISSUER,
            audience: AUDIENCE,
        });
        return payload as unknown as CustomJWTPayload;
    } catch (e) {
        throw new AuthError('Invalid or expired token');
    }
}

export async function verifyAccessToken(token: string): Promise<CustomJWTPayload> {
    const payload = await verifyAccessTokenLight(token);
    const userId = payload.userId;
    const tokenVersion = payload.tokenVersion ?? 0;
    const rows: any = await (prisma as any).$queryRaw?.(`SELECT token_version FROM users WHERE id = '${userId}'`) || [{ token_version: tokenVersion }];
    const dbVersion = rows?.[0]?.token_version ?? tokenVersion;
    if (dbVersion !== tokenVersion) throw new AuthError('Token has been revoked');
    return payload as any;
}

import { cookies } from 'next/headers';

export async function getSession() {
    try {
        const cookieStore = cookies();
        const token = cookieStore.get('session')?.value;
        if (!token) return null;
        return await verifyAccessToken(token);
    } catch (error) {
        return null;
    }
}
