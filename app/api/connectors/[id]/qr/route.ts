import { NextResponse } from 'next/server';
import { connectToDatabase } from '../../../../../lib/db/mongoose';
import { Profile } from '../../../../../models/Profile';
import axios from 'axios';
import { registerEvolutionWebhookForProfile } from '../../../../../lib/whatsapp/webhook';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await connectToDatabase();
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const phoneNumber = searchParams.get('number'); // optional: for pairing code

  const profile = await Profile.findOne({ workerId: id, channel: 'WHATSAPP' }).lean();
  if (!profile) {
    return NextResponse.json({ error: 'Connector not found' }, { status: 404 });
  }

  const instanceName = profile.instanceName || id;
  let qrCode = '';
  let pairingCode = '';
  let status = profile.status;

  const evoApiUrl = 'https://evoapi.gokortex.com';
  const apiKey = process.env.EVOLUTION_API_KEY || '';

  try {
    const stateRes = await axios.get(`${evoApiUrl}/instance/connectionState/${instanceName}`, {
      headers: { apikey: apiKey }
    });

    if (stateRes.data?.instance?.state === 'open') {
      status = 'active';
      await Profile.updateOne({ workerId: id }, { status: 'active', lastPing: new Date(), $unset: { qrCode: 1, pairingCode: 1 } });
    } else {
      const connectUrl = `${evoApiUrl}/instance/connect/${instanceName}`;
      const connectParams: Record<string, string> = {};
      if (phoneNumber) connectParams.number = phoneNumber;
      const connectRes = await axios.get(connectUrl, {
        headers: { apikey: apiKey },
        params: Object.keys(connectParams).length > 0 ? connectParams : undefined,
      });
      if (connectRes.data?.base64) {
        qrCode = connectRes.data.base64;
        const updateFields: Record<string, any> = { qrCode };
        if (!phoneNumber && profile.pairingCode) {
          updateFields.pairingCode = '';
        }
        await Profile.updateOne({ workerId: id }, updateFields);
      }
      if (phoneNumber && connectRes.data?.pairingCode) {
        pairingCode = connectRes.data.pairingCode;
        await Profile.updateOne({ workerId: id }, { pairingCode, $unset: { qrCode: 1 } });
      }
    }
  } catch (err: any) {
    const respData = err.response?.data || {};
    // Instance doesn't exist on Evolution → try to create it
    if (respData.status === 404 && String(respData.error).toLowerCase().includes('not found')) {
      console.log(`Instance ${instanceName} not found on Evolution. Attempting to create...`);
      try {
        await axios.post(`${evoApiUrl}/instance/create`, {
          instanceName,
          qrcode: true,
          integration: 'WHATSAPP-BAILEYS'
        }, { headers: { apikey: apiKey } });
        console.log(`Instance ${instanceName} created. Retrying connect...`);

        const connectUrl = `${evoApiUrl}/instance/connect/${instanceName}`;
        const connectParams: Record<string, string> = {};
        if (phoneNumber) connectParams.number = phoneNumber;
        const connectRes = await axios.get(connectUrl, {
          headers: { apikey: apiKey },
          params: Object.keys(connectParams).length > 0 ? connectParams : undefined,
        });

        if (connectRes.data?.base64) {
          qrCode = connectRes.data.base64;
          await Profile.updateOne({ workerId: id }, { qrCode, $unset: { pairingCode: 1 } });
        }
        if (phoneNumber && connectRes.data?.pairingCode) {
          pairingCode = connectRes.data.pairingCode;
          await Profile.updateOne({ workerId: id }, { pairingCode, $unset: { qrCode: 1 } });
        }
      } catch (createErr: any) {
        console.error('Failed to create or connect Evolution instance:', createErr.response?.data || createErr.message);
      }

      // Register webhook for the newly created instance
      await registerEvolutionWebhookForProfile(profile);
    } else {
      console.error('Failed to fetch QR/pairing from Evolution API:', respData || err.message);
    }
  }

  const webhookRegistered = await registerEvolutionWebhookForProfile(profile);

  return NextResponse.json({
    workerId: profile.workerId,
    sessionId: profile.sessionId,
    instanceName,
    qrCode,
    pairingCode: phoneNumber ? pairingCode : undefined,
    whatsappPhone: profile.whatsappPhone,
    status,
    assignedLocationId: profile.assignedLocationId,
    lastPing: profile.lastPing,
    webhookRegistered,
  });
}
