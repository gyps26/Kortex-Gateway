import { NextRequest, NextResponse } from 'next/server';

const PROTECTED_API_PATHS = ['/api/settings/token'];

function checkAdminAuth(req: NextRequest): boolean {
  const adminKey = process.env.ADMIN_API_KEY;
  if (!adminKey || adminKey.startsWith('your_')) return true; // skip if unset or placeholder

  const authHeader = req.headers.get('authorization') || '';
  const headerKey = req.headers.get('x-admin-key') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;

  return token === adminKey || headerKey === adminKey;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PROTECTED_API_PATHS.some((path) => pathname.startsWith(path))) {
    if (!checkAdminAuth(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/settings/:path*'],
};
