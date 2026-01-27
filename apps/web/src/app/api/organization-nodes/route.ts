import { NextRequest } from 'next/server';
import { proxy } from '@/lib/proxy';

export async function GET(req: NextRequest) {
  return proxy(req, '/api/branches');
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
