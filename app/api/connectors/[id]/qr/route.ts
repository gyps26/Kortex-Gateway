import { NextResponse } from 'next/server';
import { connectToDatabase } from '../../../../../lib/db/mongoose';
import { Profile } from '../../../../../models/Profile';
import axios from 'axios';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  await connectToDatabase();
  const { id } = await params;

  const profile = await Profile.findOne({ workerId: id, channel: 'WHATSAPP' }).lean();
  if (!profile) {
    return NextResponse.json({ error: 'Connector not found' }, { status: 404 });
  }

  let qrCode = profile.qrCode;
  let status = profile.status;
  
  try {
    const evoApiUrl = 'https://evoapi.gokortex.com';
    const apiKey = process.env.EVOLUTION_API_KEY || '';
    
    const stateRes = await axios.get(`${evoApiUrl}/instance/connectionState/${id}`, {
      headers: { apikey: apiKey }
    });
    
    if (stateRes.data?.instance?.state === 'open') {
      status = 'active';
      await Profile.updateOne({ workerId: id }, { status: 'active', lastPing: new Date() });
    } else {
      const connectRes = await axios.get(`${evoApiUrl}/instance/connect/${id}`, {
        headers: { apikey: apiKey }
      });
      if (connectRes.data?.base64) {
        qrCode = connectRes.data.base64;
      }
    }
  } catch (err: any) {
    console.error('Failed to fetch QR from Evolution API:', err.response?.data || err.message);
  }

  return NextResponse.json({
    workerId: profile.workerId,
    sessionId: profile.sessionId,
    qrCode,
    whatsappPhone: profile.whatsappPhone,
    status,
    assignedLocationId: profile.assignedLocationId,
    lastPing: profile.lastPing,
  });
}
