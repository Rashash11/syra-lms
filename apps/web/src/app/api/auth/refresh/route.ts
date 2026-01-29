import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '@/lib/auth-definitions';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/auth/refresh
 * 
 * Refreshes the access token using a valid refresh token.
 * Implements token rotation - issues new access and refresh tokens.
 */
export async function POST(request: NextRequest) {
    try {
        const cookieStore = cookies();
        const refreshToken = cookieStore.get('refreshToken')?.value;

        if (!refreshToken) {
            return NextResponse.json(
                { ok: false, error: 'No refresh token provided' },
                { status: 401 }
            );
        }

        // Verify the refresh token
        let payload;
        try {
            payload = await verifyRefreshToken(refreshToken);
        } catch (error) {
            return NextResponse.json(
                { ok: false, error: 'Invalid or expired refresh token' },
                { status: 401 }
            );
        }

        // Verify user still exists and get current tokenVersion
        const user = await prisma.user.findUnique({
            where: { id: payload.userId },
            select: {
                id: true,
                email: true,
                activeRole: true,
                tenantId: true,
                tokenVersion: true,
                status: true,
            },
        });

        if (!user) {
            return NextResponse.json(
                { ok: false, error: 'User not found' },
                { status: 401 }
            );
        }

        if (user.status !== 'ACTIVE') {
            return NextResponse.json(
                { ok: false, error: 'User account is not active' },
                { status: 401 }
            );
        }

        // Check if token version matches (handles logout-all scenario)
        if (payload.tokenVersion !== user.tokenVersion) {
            return NextResponse.json(
                { ok: false, error: 'Token has been revoked' },
                { status: 401 }
            );
        }

        // Generate new tokens
        const tokenPayload = {
            userId: user.id,
            email: user.email,
            activeRole: user.activeRole,
            tenantId: user.tenantId,
            tokenVersion: user.tokenVersion,
        };

        const newAccessToken = await signAccessToken(tokenPayload);
        const newRefreshToken = await signRefreshToken(tokenPayload);

        // Set new tokens in cookies
        const response = NextResponse.json({
            ok: true,
            message: 'Tokens refreshed successfully',
            activeRole: user.activeRole,
        });

        // Set access token (session) - 15 minutes
        response.cookies.set('session', newAccessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 15 * 60, // 15 minutes
            path: '/',
        });

        // Set refresh token - 7 days
        response.cookies.set('refreshToken', newRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60, // 7 days
            path: '/',
        });

        return response;
    } catch (error) {
        console.error('[Refresh] Error:', error);
        return NextResponse.json(
            { ok: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export const dynamic = 'force-dynamic';
