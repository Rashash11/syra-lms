import { proxy } from '@/lib/proxy';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
    return proxy(request, '/api/me');
}
