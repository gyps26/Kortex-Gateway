import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '../../../../lib/db/mongoose';
import { Message } from '../../../../models/Message';
import { UserMapping } from '../../../../models/UserMapping';
import { Profile } from '../../../../models/Profile';
import { injectInbound } from '../../../../lib/ghl/messages';

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();

    const eventName = (payload.event || '').toLowerCase();
    const instanceName = payload.instance;

    await connectToDatabase();

    if (eventName === 'connection.update') {
      const state = payload.data?.state;
      if (state === 'open') {
        await Profile.updateOne({ workerId: instanceName }, { status: 'active', lastPing: new Date() });
      } else if (state === 'close') {
        await Profile.updateOne({ workerId: instanceName }, { status: 'inactive' });
      }
      return NextResponse.json({ success: true });
    }

    if (eventName === 'messages.upsert') {
      const { data } = payload;
      const message = data.message;
      const remoteJid = data.key.remoteJid;
      const fromMe = data.key.fromMe;
      
      // Update last ping
      await Profile.updateOne({ workerId: instanceName }, { status: 'active', lastPing: new Date() });

      if (!message) {
        return NextResponse.json({ status: 'ignored_no_message' });
      }

      // Extract text content
      const text = message.conversation || message.extendedTextMessage?.text || '';
      
      if (!text) {
         return NextResponse.json({ status: 'ignored_no_text' });
      }

      const phoneNumber = remoteJid.replace('@s.whatsapp.net', '');

      if (fromMe) {
        const recentOutbound = await Message.findOne({
          phone: phoneNumber,
          body: text,
          direction: 'outbound',
          createdAt: { $gte: new Date(Date.now() - 30000) }
        });
        if (recentOutbound) {
          // It was sent by Kortex Gateway, so don't record a duplicate
          return NextResponse.json({ status: 'ignored_duplicate' });
        }
      }

      // Find the locationId via multiple fallbacks:
      // 1. Check UserMapping for this instance
      // 2. Check the Profile's assignedLocationId
      let locationId: string | undefined;
      
      const mapping = await UserMapping.findOne({ providerId: instanceName });
      if (mapping) {
        locationId = mapping.ghlLocationId;
      }
      
      if (!locationId) {
        const profile = await Profile.findOne({ workerId: instanceName });
        if (profile?.assignedLocationId) {
          locationId = profile.assignedLocationId;
        }
      }

      if (!locationId) {
        console.warn(`No location found for WhatsApp instance ${instanceName}. Message saved locally only.`);
      }

      // Save incoming text to central Message collection
      const savedMsg = await Message.create({
        locationId,
        workerId: instanceName,
        phone: phoneNumber,
        body: text,
        direction: fromMe ? 'outbound' : 'inbound',
        status: fromMe ? 'delivered' : 'received',
        channel: 'WHATSAPP',
      });

      // Inject inbound messages into GoHighLevel Conversations
      if (locationId && !fromMe) {
        try {
          await injectInbound({
            locationId,
            phone: phoneNumber,
            message: text,
          });
          console.log(`Injected inbound WhatsApp message into GHL for location ${locationId}, phone ${phoneNumber}`);
        } catch (err: any) {
          console.error('Failed to inject inbound WhatsApp message to GHL:', err.response?.data || err.message);
        }
      }

      // For outbound messages sent from WhatsApp directly (not via GHL), sync them too
      if (locationId && fromMe) {
        try {
          await injectInbound({
            locationId,
            phone: phoneNumber,
            message: text,
            direction: 'outbound',
          });
        } catch (err: any) {
          console.error('Failed to sync outbound WhatsApp message to GHL:', err.response?.data || err.message);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
