import { NextResponse } from 'next/server';

function getAppOrigin(): string {
  return (process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '');
}

export async function GET() {
  const appOrigin = getAppOrigin();
  const apiBaseUrl = appOrigin ? `${appOrigin}/api/` : '';
  const gatewayUrl = appOrigin ? `${appOrigin}/api/gateway` : '';

  return NextResponse.json({
    appUrl: appOrigin,
    apiBaseUrl,
    gatewayUrl,
    androidSetupNote:
      'Build the selfhostsim Android app with API_BASE_URL set to apiBaseUrl (ends with /api/). The QR code contains only the API key.',
  });
}
