import { NextRequest, NextResponse } from 'next/server';
import { proxy } from '@/lib/proxy';

export async function GET(req: NextRequest) {
    return proxy(req);
}

export async function PUT(req: NextRequest) {
    return proxy(req);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    // Transform DELETE /api/courses/[id] to DELETE /api/courses with body { ids: [id], action: 'delete' }
    const backend = process.env.PYTHON_BACKEND_URL || 'http://localhost:8001';
    const target = `${backend}/api/courses`;

    const headers = new Headers(req.headers);
    headers.delete('host');
    headers.delete('connection');
    headers.delete('content-length');
    headers.set('content-type', 'application/json');

    try {
        const res = await fetch(target, {
            method: 'DELETE',
            headers,
            body: JSON.stringify({ ids: [params.id], action: 'delete' }),
            redirect: 'manual',
            cache: 'no-store',
        });

        const data = await res.arrayBuffer();
        const responseHeaders = new Headers(res.headers);
        responseHeaders.delete('content-encoding');
        responseHeaders.delete('content-length');

        return new NextResponse(data, {
            status: res.status,
            headers: responseHeaders,
        });
    } catch (e) {
        console.error(`Proxy delete error for course ${params.id}:`, e);
        return NextResponse.json({ error: 'Backend unavailable' }, { status: 502 });
    }
}
