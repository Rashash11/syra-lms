import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'default_secret_key_change_me');
const ISSUER = 'lms-auth';
const AUDIENCE = 'lms-api';

export type RoleKey = 'ADMIN' | 'SUPER_INSTRUCTOR' | 'INSTRUCTOR' | 'LEARNER';

export interface LoginResponse {
    ok: boolean;
    message?: string;
    error?: string;
    activeRole: RoleKey;
    [key: string]: any;
}

export async function signAccessToken(payload: Record<string, any>) {
    const finalPayload = {
        ...payload,
        role: payload.role || payload.activeRole
    };
    const token = await new SignJWT(finalPayload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('15m')
        .setIssuer(ISSUER)
        .setAudience(AUDIENCE)
        .sign(JWT_SECRET);
    return token;
}

export async function signRefreshToken(payload: Record<string, any>) {
    const finalPayload = {
        ...payload,
        type: 'refresh'
    };
    const token = await new SignJWT(finalPayload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('7d') // Refresh tokens last 7 days
        .setIssuer(ISSUER)
        .setAudience(AUDIENCE)
        .sign(JWT_SECRET);
    return token;
}

export async function verifyRefreshToken(token: string) {
    try {
        const { payload } = await jwtVerify(token, JWT_SECRET, {
            issuer: ISSUER,
            audience: AUDIENCE,
        });
        
        // Verify it's a refresh token
        if (payload.type !== 'refresh') {
            throw new Error('Invalid token type');
        }
        
        return payload as any;
    } catch (e) {
        throw new Error('Invalid or expired refresh token');
    }
}


