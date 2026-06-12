import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '../../../../lib/db/mongoose';
import { GhlLocation } from '../../../../models/GhlLocation';
import axios from 'axios';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.json({ error: 'Missing code parameter' }, { status: 400 });
  }

  try {
    await connectToDatabase();

    // Exchange code for token
    const encodedCredentials = Buffer.from(
      `${process.env.GHL_CLIENT_ID}:${process.env.GHL_CLIENT_SECRET}`
    ).toString('base64');

    const res = await axios.post('https://services.leadconnectorhq.com/oauth/token', 
      new URLSearchParams({
        client_id: process.env.GHL_CLIENT_ID as string,
        client_secret: process.env.GHL_CLIENT_SECRET as string,
        grant_type: 'authorization_code',
        code: code,
      }), 
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        }
      }
    );

    const { access_token, refresh_token, locationId, expires_in, companyId } = res.data;

    if (!locationId) {
      return NextResponse.json({ error: 'Invalid response from GHL, missing locationId' }, { status: 400 });
    }

    // Save to DB
    await GhlLocation.findOneAndUpdate(
      { locationId },
      {
        locationId,
        accessToken: access_token,
        refreshToken: refresh_token,
        expiresAt: new Date(Date.now() + expires_in * 1000),
        companyName: companyId, // or fetch company name later
      },
      { upsert: true, new: true }
    );

    // Redirect to a success page or dashboard
    return NextResponse.redirect(new URL('/settings?success=true', req.url));

  } catch (error: any) {
    console.error('GHL OAuth Error:', error.response?.data || error.message);
    return NextResponse.json({ error: 'Failed to authenticate with GHL' }, { status: 500 });
  }
}
