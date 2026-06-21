import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '../../../lib/db/mongoose';
import { Message } from '../../../models/Message';
import { createOutboundMessage, processOutboundJob } from '../../../lib/routing/channelRouter';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  await connectToDatabase();
  try {
    const { searchParams } = req.nextUrl;
    const channel = searchParams.get('channel');
    const direction = searchParams.get('direction');
    const status = searchParams.get('status');
    const locationId = searchParams.get('locationId');

    const filter: Record<string, unknown> = {};
    if (channel && channel !== 'All Channels') filter.channel = channel;
    if (direction && direction !== 'All') filter.direction = direction;
    if (status && status !== 'All Statuses') filter.status = status;
    if (locationId && locationId !== 'All Subaccounts') filter.locationId = locationId;

    const messages = await Message.find(filter).sort({ createdAt: -1 }).limit(100).lean();
    return NextResponse.json({ messages });
  } catch {
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  await connectToDatabase();
  try {
    const { to, body, locationId, channel } = await req.json();
    if (!to || !body) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

    if (!locationId) {
      return NextResponse.json({ error: 'locationId is required for multi-channel routing' }, { status: 400 });
    }

    const message = await createOutboundMessage({
      phone: to,
      body,
      locationId,
      channel,
    });

    return NextResponse.json({ success: true, queued: true, message });
  } catch {
    return NextResponse.json({ error: 'Failed to send' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  await connectToDatabase();
  try {
    const { messageId } = await req.json();
    if (!messageId) return NextResponse.json({ error: 'messageId required' }, { status: 400 });

    const msg = await Message.findById(messageId);
    if (!msg) return NextResponse.json({ error: 'Message not found' }, { status: 404 });

    if (msg.direction !== 'outbound') {
      return NextResponse.json({ error: 'Can only retry outbound messages' }, { status: 400 });
    }

    msg.status = 'pending';
    msg.errorDetails = undefined;
    msg.workerId = undefined;
    msg.deviceId = undefined;
    await msg.save();

    try {
      const result = await processOutboundJob(msg._id.toString());
      return NextResponse.json({ success: true, status: result?.status });
    } catch (err: unknown) {
      const e = err as { message?: string };
      return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
  } catch (err: unknown) {
    const e = err as { message?: string };
    return NextResponse.json({ error: e.message || 'Failed to retry' }, { status: 500 });
  }
}
