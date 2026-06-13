import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '../../../lib/db/mongoose';
import { GhlLocation } from '../../../models/GhlLocation';
import { GlobalSettings } from '../../../models/GlobalSettings';
import { fetchLocationName } from '../../../lib/ghl';
import axios from 'axios';

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
    
    const settings = await GlobalSettings.findOne({});
    if (!settings || !settings.ghlClientId || !settings.ghlClientSecret) {
      return NextResponse.redirect(new URL('/integration?error=missing_credentials', origin));
    }

    const res = await axios.post(
      'https://services.leadconnectorhq.com/oauth/token',
      new URLSearchParams({
        client_id: settings.ghlClientId,
        client_secret: settings.ghlClientSecret,
        grant_type: 'authorization_code',
        code,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    const { access_token, refresh_token, locationId, expires_in, companyId } = res.data;

    if (!locationId) {
      return NextResponse.redirect(new URL('/integration?error=missing_location', origin));
    }

    const locationName = (await fetchLocationName(locationId, access_token)) || companyId;

    await GhlLocation.findOneAndUpdate(
      { locationId },
      {
        locationId,
        accessToken: access_token,
        refreshToken: refresh_token,
        expiresAt: new Date(Date.now() + expires_in * 1000),
        companyName: locationName,
        updatedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    return NextResponse.redirect(new URL('/integration?success=true', origin));
  } catch (error: unknown) {
    const err = error as { response?: { data?: unknown }; message?: string };
    console.error('GHL OAuth Error:', err.response?.data || err.message);
    return NextResponse.redirect(new URL('/integration?error=oauth_failed', origin));
  }
}
