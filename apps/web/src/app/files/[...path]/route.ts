import { NextRequest, NextResponse } from 'next/server';
import { readFile, stat } from 'fs/promises';
import { join, extname } from 'path';

function getMimeType(filePath: string): string {
    const ext = extname(filePath).toLowerCase();
    const map: Record<string, string> = {
        '.mp3': 'audio/mpeg',
        '.wav': 'audio/wav',
        '.ogg': 'audio/ogg',
        '.m4a': 'audio/x-m4a',
        '.mp4': 'video/mp4',
        '.webm': 'video/webm',
        '.pdf': 'application/pdf',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
        '.svg': 'image/svg+xml',
    };
    return map[ext] || 'application/octet-stream';
}

export async function GET(
    request: NextRequest,
    { params }: { params: { path: string[] } }
) {
    try {
        const pathSegments = params.path;
        if (!pathSegments || pathSegments.length === 0) {
            return new NextResponse('File not found', { status: 404 });
        }

        const primary = join(process.cwd(), 'public', 'uploads', ...pathSegments);
        const secondary = join(process.cwd(), 'apps', 'web', 'public', 'uploads', ...pathSegments);
        const tertiary = join(process.cwd(), 'services', 'api', 'public', 'uploads', ...pathSegments);

        let filePath = primary;

        // Try primary; fall back to secondary to maintain compatibility
        let stats;
        try {
            stats = await stat(filePath);
        } catch {
            try {
                stats = await stat(secondary);
                filePath = secondary;
            } catch {
                try {
                    stats = await stat(tertiary);
                    filePath = tertiary;
                } catch (e) {
                    // Final fallback: proxy to backend /api/files
                    try {
                        const backend = process.env.PYTHON_BACKEND_URL || 'http://localhost:8001';
                        const resp = await fetch(`${backend}/api/files/${pathSegments.join('/')}`, {
                            headers: { 
                                range: request.headers.get('range') || '',
                                cookie: request.headers.get('cookie') || ''
                            }
                        });
                        const data = await resp.arrayBuffer();
                        const headers = new Headers();
                        const ct = resp.headers.get('content-type') || 'application/octet-stream';
                        headers.set('Content-Type', ct);
                        const cr = resp.headers.get('content-range');
                        if (cr) headers.set('Content-Range', cr);
                        const ar = resp.headers.get('accept-ranges');
                        if (ar) headers.set('Accept-Ranges', ar);
                        headers.set('Cache-Control', 'public, max-age=3600, must-revalidate');
                        return new NextResponse(data, { status: resp.status, headers });
                    } catch (proxyErr) {
                        console.error('File stat error and backend proxy failed:', proxyErr);
                        return new NextResponse('File not found', { status: 404 });
                    }
                }
            }
        }
        if (!stats.isFile()) {
            return new NextResponse('File not found', { status: 404 });
        }

        const fileBuffer = await readFile(filePath);

        // Determine mime type
        const mimeType = getMimeType(filePath);

        const headers = new Headers();
        headers.set('Content-Type', mimeType);
        headers.set('Accept-Ranges', 'bytes');
        // Cache control
        headers.set('Cache-Control', 'public, max-age=3600, must-revalidate');
        
        // Support Range requests for HTML5 video/audio
        const range = request.headers.get('range');
        if (range) {
            const match = range.match(/bytes=(\d+)-(\d+)?/);
            if (match) {
                const start = parseInt(match[1], 10);
                const end = match[2] ? parseInt(match[2], 10) : fileBuffer.length - 1;
                const chunk = fileBuffer.slice(start, end + 1);
                headers.set('Content-Range', `bytes ${start}-${end}/${fileBuffer.length}`);
                headers.set('Content-Length', chunk.length.toString());
                return new NextResponse(chunk, { status: 206, headers });
            }
        }
        
        headers.set('Content-Length', fileBuffer.length.toString());

        return new NextResponse(fileBuffer, { headers });

    } catch (error) {
        console.error('Error serving file:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
