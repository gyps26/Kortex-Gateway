import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '../../../../lib/db/mongoose';
import { GhlAuth } from '../../../../models/GhlAuth';
import { exchangeToken } from '../../../../lib/ghl/oauth';
import { GlobalSettings } from '../../../../models/GlobalSettings';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  
  let origin = req.nextUrl.origin;
  if (origin.startsWith('https://localhost') || origin.startsWith('https://127.0.0.1')) {
    origin = origin.replace('https://', 'http://');
  }

  if (!code) {
    return NextResponse.redirect(new URL('/settings/ghl?error=missing_code', origin));
  }

  try {
    await connectToDatabase();
    
    // Attempt to get client ID and secret from DB, or fallback to ENV
    const settings = await GlobalSettings.findOne({});
    const clientId = settings?.ghlClientId || process.env.GHL_CLIENT_ID || process.env.NEXT_PUBLIC_GHL_CLIENT_ID;
    const clientSecret = settings?.ghlClientSecret || process.env.GHL_CLIENT_SECRET;
    const redirectUri = process.env.GHL_REDIRECT_URI || process.env.NEXT_PUBLIC_GHL_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
      console.error('Missing GHL OAuth credentials or redirect URI');
      return NextResponse.redirect(new URL('/settings/ghl?error=missing_credentials', origin));
    }

    const tokenData = await exchangeToken(code, clientId, clientSecret, redirectUri);
    const { access_token, refresh_token, locationId, expires_in } = tokenData;

    if (!locationId) {
      return NextResponse.redirect(new URL('/settings/ghl?error=missing_location', origin));
    }

    const expiresAt = new Date(Date.now() + expires_in * 1000);

    await GhlAuth.findOneAndUpdate(
      { locationId },
      {
        locationId,
        accessToken: access_token,
        refreshToken: refresh_token,
        expiresAt,
        updatedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    return NextResponse.redirect(new URL('/settings/ghl?success=true', origin));
  } catch (error: any) {
    console.error('GHL OAuth Callback Error:', error.message);
    return NextResponse.redirect(new URL('/settings/ghl?error=oauth_failed', origin));
  }
}
