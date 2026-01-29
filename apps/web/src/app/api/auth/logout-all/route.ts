import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAccessToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/auth/logout-all
 * 
 * Logs out the user from all devices by incrementing their tokenVersion.
 * This invalidates all existing access and refresh tokens.
 */
export async function POST(request: NextRequest) {
    try {
        const cookieStore = cookies();
        const sessionToken = cookieStore.get('session')?.value;

        if (!sessionToken) {
            return NextResponse.json(
                { ok: false, error: 'Not authenticated' },
                { status: 401 }
            );
        }

        // Verify the current session
        let payload;
        try {
            payload = await verifyAccessToken(sessionToken);
        } catch (error) {
            return NextResponse.json(
                { ok: false, error: 'Invalid session' },
                { status: 401 }
            );
        }

        // Increment the user's tokenVersion to invalidate all tokens
        await prisma.user.update({
            where: { id: payload.userId },
            data: {
                tokenVersion: {
                    increment: 1,
                },
            },
        });

        // Clear cookies
        const response = NextResponse.json({
            ok: true,
            message: 'Logged out from all devices successfully',
        });

        response.cookies.delete('session');
        response.cookies.delete('refreshToken');

        return response;
    } catch (error) {
        console.error('[Logout-All] Error:', error);
        return NextResponse.json(
            { ok: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export const dynamic = 'force-dynamic';
