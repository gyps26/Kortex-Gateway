import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '../../../../lib/db/mongoose';
import { GlobalSettings } from '../../../../models/GlobalSettings';

export async function GET() {
  try {
    await connectToDatabase();
    let settings = await GlobalSettings.findOne({});
    if (!settings) {
      settings = await GlobalSettings.create({ ghlClientId: '', ghlClientSecret: '' });
    }
    // We only send the clientId to the frontend to avoid exposing the secret, unless we need the frontend to see it's set.
    // The user might need to see the Client ID they configured.
    return NextResponse.json({
      ghlClientId: settings.ghlClientId,
      hasClientSecret: !!settings.ghlClientSecret,
      appUrl: process.env.APP_URL || '',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { ghlClientId, ghlClientSecret } = await req.json();
    await connectToDatabase();
    
    let settings = await GlobalSettings.findOne({});
    if (!settings) {
      settings = new GlobalSettings();
    }
    
    if (ghlClientId !== undefined) settings.ghlClientId = ghlClientId;
    if (ghlClientSecret !== undefined) settings.ghlClientSecret = ghlClientSecret;
    
    await settings.save();
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
