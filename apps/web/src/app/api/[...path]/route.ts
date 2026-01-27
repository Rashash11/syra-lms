
import { NextRequest } from 'next/server';
import { proxy } from '@/lib/proxy';

// Catch-all route handler for API proxying
// This ensures all /api/* requests that don't match specific route handlers
// are proxied to the backend with correct cookie forwarding via lib/proxy.ts

export async function GET(req: NextRequest) {
  return proxy(req);
}

export async function POST(req: NextRequest) {
  console.log(`[CatchAll] POST request to: ${req.url}`);
  try {
    return await proxy(req);
  } catch (e) {
    console.error(`[CatchAll] POST error:`, e);
    throw e;
  }
}

export async function PUT(req: NextRequest) {
  return proxy(req);
}

export async function PATCH(req: NextRequest) {
  return proxy(req);
}

export async function DELETE(req: NextRequest) {
  return proxy(req);
}

export const dynamic = 'force-dynamic';
