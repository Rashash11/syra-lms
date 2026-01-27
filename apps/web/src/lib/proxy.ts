import { NextRequest, NextResponse } from 'next/server';

const backend = process.env.PYTHON_BACKEND_URL || 'http://127.0.0.1:8000';

export async function proxy(req: NextRequest, path?: string) {
    const url = new URL(req.url);
    const targetPath = path || url.pathname;
    const target = `${backend}${targetPath}${url.search}`;

    const headers = new Headers(req.headers);
    headers.delete('host');
    headers.delete('connection');
    headers.delete('content-length');
    const rawCookie = req.headers.get('cookie') || '';
    const cookieList = req.cookies.getAll();
    const cookieHeader =
        rawCookie || cookieList.map(c => `${c.name}=${c.value}`).join('; ');
    if (cookieHeader) {
        headers.set('cookie', cookieHeader);
    }

    let body: any = undefined;
    if (!['GET', 'HEAD'].includes(req.method)) {
        try {
            const arrayBuffer = await req.arrayBuffer();
            if (arrayBuffer.byteLength > 0) {
                body = arrayBuffer;
            }
        } catch (e) {
            // Body might be already consumed or empty
        }
    }

    try {
        console.log(`[Proxy] Fetching: ${target}`);
        const res = await fetch(target, {
            method: req.method,
            headers,
            body,
            redirect: 'manual',
            cache: 'no-store',
        });

        console.log(`[Proxy] Response status: ${res.status} for ${targetPath}`);
        const data = await res.arrayBuffer();
        const responseHeaders = new Headers(res.headers);

        // Ensure we don't pass encoding headers that might conflict with Next.js handling
        responseHeaders.delete('content-encoding');
        responseHeaders.delete('content-length');

        return new NextResponse(data, {
            status: res.status,
            headers: responseHeaders,
        });
    } catch (e: any) {
        console.error(`Proxy error for ${targetPath}:`, e?.message || e);
        console.error('Full error:', JSON.stringify(e, Object.getOwnPropertyNames(e)));
        return NextResponse.json({ error: 'Backend unavailable', message: e?.message }, { status: 502 });
    }
}
