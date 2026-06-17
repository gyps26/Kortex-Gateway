import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '../../../../lib/db/mongoose';
import { GhlAuth } from '../../../../models/GhlAuth';
import { GhlLocation } from '../../../../models/GhlLocation';
import { exchangeToken } from '../../../../lib/ghl/oauth';
import { GlobalSettings } from '../../../../models/GlobalSettings';
import { fetchLocationName } from '../../../../lib/ghl';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  
  let origin = req.nextUrl.origin;
  if (origin.startsWith('https://localhost') || origin.startsWith('https://127.0.0.1')) {
    origin = origin.replace('https://', 'http://');
  }

  if (!code) {
    return NextResponse.redirect(new URL('/integration?error=missing_code', origin));
  }

  try {
    await connectToDatabase();
    
    // Attempt to get client ID and secret from DB, or fallback to ENV
    const settings = await GlobalSettings.findOne({});
    
    // Helper to filter out placeholder values from .env
    const isReal = (val: string | undefined) => val && !val.startsWith('your_');
    
    const clientId = isReal(settings?.ghlClientId) ? settings!.ghlClientId 
                   : isReal(process.env.GHL_CLIENT_ID) ? process.env.GHL_CLIENT_ID 
                   : isReal(process.env.NEXT_PUBLIC_GHL_CLIENT_ID) ? process.env.NEXT_PUBLIC_GHL_CLIENT_ID 
                   : null;
    const clientSecret = isReal(settings?.ghlClientSecret) ? settings!.ghlClientSecret 
                       : isReal(process.env.GHL_CLIENT_SECRET) ? process.env.GHL_CLIENT_SECRET 
                       : null;
    
    // Use APP_URL if available (critical for ngrok/tunnel setups where origin resolves to localhost)
    const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_GHL_REDIRECT_URI?.replace('/api/oauth/callback', '') || origin;
    const redirectUri = process.env.GHL_REDIRECT_URI || process.env.NEXT_PUBLIC_GHL_REDIRECT_URI || `${appUrl}/api/oauth/callback`;

    if (!clientId || !clientSecret) {
      console.error('Missing GHL OAuth credentials. clientId:', !!clientId, 'clientSecret:', !!clientSecret, 'DB settings found:', !!settings, 'DB clientId:', settings?.ghlClientId?.substring(0, 8) + '...');
      return NextResponse.redirect(new URL('/integration?error=missing_credentials', origin));
    }

    const tokenData = await exchangeToken(code, clientId, clientSecret, redirectUri);
    const { access_token, refresh_token, locationId, expires_in } = tokenData;

    if (!locationId) {
      return NextResponse.redirect(new URL('/integration?error=missing_location', origin));
    }

    const expiresAt = new Date(Date.now() + expires_in * 1000);

    // Save to GhlAuth (token store)
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

    // Also save to GhlLocation (used by Subaccounts page, routing engine, etc.)
    let companyName: string | undefined;
    try {
      companyName = await fetchLocationName(locationId, access_token);
    } catch { /* ignore */ }

    await GhlLocation.findOneAndUpdate(
      { locationId },
      {
        locationId,
        accessToken: access_token,
        refreshToken: refresh_token,
        expiresAt,
        companyName: companyName || undefined,
        updatedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    return NextResponse.redirect(new URL('/integration?success=true', origin));
  } catch (error: any) {
    console.error('GHL OAuth Callback Error:', error.response?.data || error.message);
    return NextResponse.redirect(new URL('/integration?error=oauth_failed', origin));
  }
}
