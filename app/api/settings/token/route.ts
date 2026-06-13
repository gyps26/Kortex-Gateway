import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  let appUrl = process.env.APP_URL || req.nextUrl.origin;
  if (appUrl.startsWith('https://localhost') || appUrl.startsWith('https://127.0.0.1')) {
    appUrl = appUrl.replace('https://', 'http://');
  }
  const secret = process.env.API_SECRET || '';
  const workerApiUrl = `${appUrl.replace(/\/$/, '')}/api/worker`;

  return NextResponse.json({
    token: `${workerApiUrl}|${secret}`,
    apiUrl: workerApiUrl,
    secret: secret || 'NOT_CONFIGURED',
    installerUrl: `${appUrl.replace(/\/$/, '')}/api/installer`,
  });
}
