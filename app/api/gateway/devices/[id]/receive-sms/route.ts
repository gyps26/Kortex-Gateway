import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '../../../../../../lib/db/mongoose';
import { Message } from '../../../../../../models/Message';
import { Profile } from '../../../../../../models/Profile';
import { injectInbound } from '../../../../../../lib/ghl/messages';
import { authenticateDevice, unauthorizedResponse } from '../../../../../../lib/gateway/auth';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const profile = await authenticateDevice(req);
    if (!profile) {
      const keyPrefix = req.headers.get('x-api-key')?.slice(0, 8) || '(missing)';
      console.error(`[receive-sms] Auth failed — x-api-key prefix: ${keyPrefix}. Check Profile has channel='SMS' and matching apiKey.`);
      return unauthorizedResponse();
    }

    const { id } = await params;

    if (!profile.assignedLocationId) {
      console.error(`[receive-sms] Device ${profile.workerId} (${profile.name}) has no assignedLocationId. Assign it in Subaccounts page.`);
      return NextResponse.json({ error: 'Device not assigned to a location' }, { status: 400 });
    }

    const body = await req.json();
    const sender = body.sender;
    const messageText = body.message;
    const receivedAtInMillis = body.receivedAtInMillis || Date.now();

    if (!sender || !messageText) {
      return NextResponse.json({ error: 'Missing sender or message' }, { status: 400 });
    }

    await connectToDatabase();

    profile.lastPing = new Date();
    await profile.save();

    const message = await Message.create({
      workerId: profile.workerId,
      deviceId: profile.workerId,
      locationId: profile.assignedLocationId,
      phone: sender,
      body: messageText,
      channel: 'SMS',
      direction: 'inbound',
      status: 'received',
    });

    try {
      await injectInbound({
        locationId: profile.assignedLocationId,
        phone: sender,
        message: messageText,
        channel: 'SMS',
      });
    } catch (ghlErr: unknown) {
      const err = ghlErr as { response?: { data?: { message?: string } }; message?: string };
      const detail = err.response?.data ? JSON.stringify(err.response.data) : err.message;
      console.error(`[receive-sms] GHL injection failed for ${sender}: ${detail}`);
    }

    return NextResponse.json({
      smsId: message._id.toString(),
      receivedAtInMillis,
    });
  } catch (error: unknown) {
    console.error('Inbound SMS error:', error);
    return NextResponse.json({ error: 'Failed to process inbound SMS' }, { status: 500 });
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const apiKey = req.nextUrl.searchParams.get('apiKey') || req.headers.get('x-api-key');
    if (!apiKey) {
      return NextResponse.json({
        error: 'Missing apiKey',
        usage: 'curl "http://localhost:3000/api/gateway/devices/TEST/receive-sms?sender=+1234567890&message=hello&apiKey=YOUR_KEY"',
      }, { status: 400 });
    }

    await connectToDatabase();

    const profile = await Profile.findOne({ apiKey, channel: 'SMS' });
    if (!profile) {
      return NextResponse.json({
        error: 'Auth failed — no SMS device found with that apiKey',
        hint: 'Create an SMS device in Settings > Subaccounts > Add Device, then scan the QR code with the Android app.',
      }, { status: 401 });
    }

    const sender = req.nextUrl.searchParams.get('sender');
    const messageText = req.nextUrl.searchParams.get('message');

    if (!sender || !messageText) {
      return NextResponse.json({
        message: 'Device auth OK. Provide ?sender= and ?message= to send a test SMS.',
        device: {
          workerId: profile.workerId,
          name: profile.name,
          status: profile.status,
          channel: profile.channel,
          assignedLocationId: profile.assignedLocationId || '(NOT SET — go to Subaccounts page)',
          lastPing: profile.lastPing,
          errorThreshold: profile.errorThreshold,
        },
      });
    }

    if (!profile.assignedLocationId) {
      return NextResponse.json({
        error: 'Device not assigned to any location',
        hint: 'Go to Subaccounts page, select a location, and assign this device.',
      }, { status: 400 });
    }

    const message = await Message.create({
      workerId: profile.workerId,
      deviceId: profile.workerId,
      locationId: profile.assignedLocationId,
      phone: sender,
      body: messageText,
      channel: 'SMS',
      direction: 'inbound',
      status: 'received',
    });

    let ghlResult: Record<string, unknown> | string = 'not attempted';
    try {
      await injectInbound({
        locationId: profile.assignedLocationId,
        phone: sender,
        message: messageText,
        channel: 'SMS',
      });
      ghlResult = 'success';
    } catch (ghlErr: unknown) {
      const err = ghlErr as { response?: { data?: unknown }; message?: string };
      ghlResult = { error: 'injection_failed', detail: err.response?.data || err.message };
    }

    return NextResponse.json({
      success: true,
      smsId: message._id.toString(),
      ghlInjection: ghlResult,
      device: {
        workerId: profile.workerId,
        name: profile.name,
        status: profile.status,
      },
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
