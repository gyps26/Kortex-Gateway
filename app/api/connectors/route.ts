import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { connectToDatabase } from '../../../lib/db/mongoose';
import { Profile } from '../../../models/Profile';
import axios from 'axios';
import { registerEvolutionWebhook } from '../../../lib/whatsapp/webhook';


export async function GET(req: NextRequest) {
  await connectToDatabase();
  const channel = req.nextUrl.searchParams.get('channel');

  const filter: Record<string, string> = {};
  if (channel) filter.channel = channel;

  const profiles = await Profile.find(filter).sort({ lastPing: -1 }).lean();
  return NextResponse.json({ profiles });
}

function parseProxyUrl(proxyUrl: string): { host: string; port: string; protocol: string; username?: string; password?: string } | null {
  try {
    const url = new URL(proxyUrl);
    return {
      host: url.hostname,
      port: url.port || (url.protocol === 'https:' ? '443' : '80'),
      protocol: url.protocol.replace(':', ''),
      username: url.username || undefined,
      password: url.password || undefined,
    };
  } catch {
    return null;
  }
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
    const instanceName = body.instanceName || body.name || workerId;
    const proxyUrl = body.proxy;
    const proxy = proxyUrl ? parseProxyUrl(proxyUrl) : undefined;

    const profile = await Profile.create({
      workerId,
      sessionId,
      name: body.name || `WhatsApp ${workerId}`,
      channel: 'WHATSAPP',
      status: 'inactive',
      assignedLocationId: body.assignedLocationId,
      instanceName,
      proxy: proxyUrl,
    });

    const evoApiUrl = 'https://evoapi.gokortex.com';
    const apiKey = process.env.EVOLUTION_API_KEY || '';
    
    try {
      const createPayload: any = {
        instanceName,
        qrcode: true,
        integration: 'WHATSAPP-BAILEYS'
      };
      if (proxy) {
        createPayload.proxy = proxy;
      }
      await axios.post(`${evoApiUrl}/instance/create`, createPayload, {
        headers: { apikey: apiKey }
      });
    } catch (evoErr: any) {
      console.error('Failed to create Evolution API instance:', evoErr.response?.data || evoErr.message);
    }

    await registerEvolutionWebhook(instanceName);

    return NextResponse.json({ profile });
  } catch (error: unknown) {
    console.error('WhatsApp connector creation error:', error);
    return NextResponse.json({ error: 'Failed to create connector' }, { status: 500 });
  }
}
