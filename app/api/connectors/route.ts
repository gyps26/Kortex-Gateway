import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { connectToDatabase } from '../../../lib/db/mongoose';
import { Profile } from '../../../models/Profile';
import axios from 'axios';


export async function GET(req: NextRequest) {
  await connectToDatabase();
  const channel = req.nextUrl.searchParams.get('channel');

  const filter: Record<string, string> = {};
  if (channel) filter.channel = channel;

  const profiles = await Profile.find(filter).sort({ lastPing: -1 }).lean();
  return NextResponse.json({ profiles });
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const channel = body.channel || 'WHATSAPP';

    if (channel !== 'WHATSAPP') {
      return NextResponse.json({ error: 'Use /api/gateway/devices for SMS registration' }, { status: 400 });
    }

    const sessionId = body.sessionId || crypto.randomUUID();
    const workerId = `wa-${sessionId.slice(0, 8)}`;

    const profile = await Profile.create({
      workerId,
      sessionId,
      name: body.name || `WhatsApp ${workerId}`,
      channel: 'WHATSAPP',
      status: 'inactive',
      assignedLocationId: body.assignedLocationId,
    });

    const evoApiUrl = 'https://evoapi.gokortex.com';
    const apiKey = process.env.EVOLUTION_API_KEY || '';
    
    try {
      await axios.post(`${evoApiUrl}/instance/create`, {
        instanceName: workerId,
        qrcode: true,
        integration: 'WHATSAPP-BAILEYS'
      }, {
        headers: { apikey: apiKey }
      });
      
      const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || '';
      if (appUrl) {
        await axios.post(`${evoApiUrl}/webhook/set/${workerId}`, {
          webhook: {
            url: `${appUrl}/api/webhooks/whatsapp`,
            byEvents: false,
            base64: false,
            events: [
              "MESSAGES_UPSERT",
              "CONNECTION_UPDATE"
            ]
          }
        }, {
          headers: { apikey: apiKey }
        });
      }
    } catch (evoErr: any) {
      console.error('Failed to create Evolution API instance:', evoErr.response?.data || evoErr.message);
    }



    return NextResponse.json({ profile });
  } catch (error: unknown) {
    console.error('WhatsApp connector creation error:', error);
    return NextResponse.json({ error: 'Failed to create connector' }, { status: 500 });
  }
}
