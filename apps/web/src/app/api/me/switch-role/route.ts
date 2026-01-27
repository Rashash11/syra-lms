import { proxy } from '@/lib/proxy';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
    return proxy(request, '/api/me/switch-role');
}
