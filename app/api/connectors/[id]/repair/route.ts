import { NextResponse } from 'next/server';
import { connectToDatabase } from '../../../../../lib/db/mongoose';
import { Profile } from '../../../../../models/Profile';


export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const { id } = await params;

    const profile = await Profile.findOne({ workerId: id, channel: 'WHATSAPP' });
    if (!profile) {
      return NextResponse.json({ error: 'Connector not found' }, { status: 404 });
    }

    if (!profile.sessionId) {
      return NextResponse.json({ error: 'Connector has no session' }, { status: 400 });
    }

    await Profile.updateOne(
      { workerId: id },
      {
        $set: { status: 'inactive', lastPing: new Date() },
        $unset: { qrCode: 1, whatsappPhone: 1 },
      }
    );



    return NextResponse.json({ success: true, workerId: id });
  } catch (error: unknown) {
    console.error('WhatsApp re-pair error:', error);
    return NextResponse.json({ error: 'Failed to start re-pair' }, { status: 500 });
  }
}
