import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { connectToDatabase } from '../../../../lib/db/mongoose';
import { Message } from '../../../../models/Message';
import { outboundQueue } from '../../../../lib/queue/redis';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-wh-signature');

    // Optional: HMAC Verification if you provide a webhook secret in env
    /*
    if (process.env.GHL_WEBHOOK_SECRET) {
      const expectedSignature = crypto
        .createHmac('sha256', process.env.GHL_WEBHOOK_SECRET)
        .update(rawBody)
        .digest('hex');
      if (signature !== expectedSignature) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }
    */

    const body = JSON.parse(rawBody);
    
    // GHL sends sms body differently depending on if it's a Workflow Webhook or a Custom SMS Provider
    const contactId = body.contact_id || body.contactId;
    const phoneNum = body.phone || body.to;
    const msgBody = body.message || body.body;
    const locId = body.location_id || body.locationId;
    const ghlMsgId = body.messageId || body.message_id;
    const attachments = body.attachments || [];

    if (!phoneNum || !msgBody || !locId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await connectToDatabase();

    // 1. Create a Message log
    const newMessage = await Message.create({
      ghlContactId: contactId,
      ghlMessageId: ghlMsgId,
      locationId: locId,
      phone: phoneNum,
      body: msgBody,
      attachments: attachments,
      direction: 'outbound',
      status: 'pending'
    });

    // 2. Push to Redis queue
    if (outboundQueue) {
      await outboundQueue.add('send_sms', { messageId: newMessage._id });
    }

    return NextResponse.json({ success: true, messageId: newMessage._id });

  } catch (error: any) {
    console.error('Outbound Webhook Error:', error.message);
    return NextResponse.json({ error: 'Failed to process webhook' }, { status: 500 });
  }
}
