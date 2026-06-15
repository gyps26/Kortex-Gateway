import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '../../../../lib/db/mongoose';
import { Message } from '../../../../models/Message';
import { UserMapping } from '../../../../models/UserMapping';

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();

    // Evolution API sends webhooks for various events. We track MESSAGES_UPSERT
    if (payload.event === 'messages.upsert') {
      const { data } = payload;
      const message = data.message;
      const remoteJid = data.key.remoteJid;
      const fromMe = data.key.fromMe;
      const instanceName = payload.instance;

      if (fromMe || !message) {
        return NextResponse.json({ status: 'ignored' });
      }

      // Extract text content
      const text = message.conversation || message.extendedTextMessage?.text || '';
      
      if (!text) {
         return NextResponse.json({ status: 'ignored_no_text' });
      }

      const phoneNumber = remoteJid.replace('@s.whatsapp.net', '');

      await connectToDatabase();

      // Query UserMapping collection to find context
      const mapping = await UserMapping.findOne({ providerId: instanceName });
      let locationId = undefined;
      
      if (mapping) {
        locationId = mapping.ghlLocationId;
      } else {
        console.warn(`No UserMapping found for instance ${instanceName}`);
      }

      // Save incoming text cleanly to central Message collection
      await Message.create({
        locationId,
        phone: phoneNumber,
        body: text,
        direction: 'inbound',
        status: 'received',
        channel: 'WHATSAPP',
      });

      // TODO: Trigger internal GoHighLevel v2 synchronization routines
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
