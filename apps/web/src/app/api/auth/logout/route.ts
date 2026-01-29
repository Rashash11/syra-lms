import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * POST /api/auth/logout
 * 
 * Logs out the user from the current device by clearing cookies.
 * Does not invalidate tokens on other devices.
 */
export async function POST(request: NextRequest) {
    try {
        const response = NextResponse.json({
            ok: true,
            message: 'Logged out successfully',
        });

        // Clear authentication cookies
        response.cookies.delete('session');
        response.cookies.delete('refreshToken');

        return response;
    } catch (error) {
        console.error('[Logout] Error:', error);
        return NextResponse.json(
            { ok: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export const dynamic = 'force-dynamic';
