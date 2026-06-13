import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '../../../../../lib/db/mongoose';
import { Message } from '../../../../../models/Message';
import { outboundQueue } from '../../../../../lib/queue/redis';

function verifyWebhookAuth(req: NextRequest): boolean {
  const expectedSecret = process.env.GHL_WEBHOOK_SECRET;
  if (!expectedSecret) return true;

  const authHeader = req.headers.get('authorization') || req.headers.get('x-ghl-webhook-secret') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
  return token === expectedSecret;
}

export async function POST(req: NextRequest) {
  try {
  if (!verifyWebhookAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();

  const phone = body.phone || body.to;
  const msgBody = body.body || body.message;
  const locationId = body.locationId || body.location_id || req.headers.get('x-ghl-location-id');
  const contactId = body.contactId || body.contact_id;
  const ghlMessageId = body.messageId || body.message_id;

  if (!phone || !msgBody) {
    return NextResponse.json({ error: 'Missing phone or body' }, { status: 400 });
  }

  if (!locationId) {
    return NextResponse.json({ error: 'Missing locationId — required to route message to a Mac worker' }, { status: 400 });
  }

  await connectToDatabase();

  const message = new Message({
    ghlContactId: contactId,
    ghlMessageId,
    locationId,
    phone,
    body: msgBody,
    attachments: body.attachments || [],
    direction: 'outbound',
    status: 'pending',
  });

  await message.save();

  if (outboundQueue) {
    await outboundQueue.add(
      'send-sms',
      { messageId: message._id },
      {
        removeOnComplete: true,
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
      }
    );
  } else {
    console.warn('Redis not configured. Message saved but not queued.');
  }

  return NextResponse.json({ success: true, messageId: message._id });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('Error handling GHL webhook:', error);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
