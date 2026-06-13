import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '../../../lib/db/mongoose';
import { Message } from '../../../models/Message';
import { outboundQueue } from '../../../lib/queue/redis';

export async function GET() {
  await connectToDatabase();
  try {
    const messages = await Message.find().sort({ createdAt: -1 }).limit(100).lean();
    return NextResponse.json({ messages });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  await connectToDatabase();
  try {
    const { to, body } = await req.json();
    if (!to || !body) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

    const msg = await Message.create({
      direction: 'outbound',
      phone: to,
      body: body,
      status: 'pending',
    });

    if (outboundQueue) {
      await outboundQueue.add('send-sms', { messageId: msg._id.toString() });
      return NextResponse.json({ success: true, queued: true, message: msg });
    }

    // Fallback if no redis: assign directly
    const { Profile } = require('../../../models/Profile');
    const activeProfiles = await Profile.find({ status: 'active' }).sort({ lastPing: -1 });

    let selectedProfile = null;
    for (const profile of activeProfiles) {
        if (profile.dailyCount < 50) {
            selectedProfile = profile;
            break;
        }
    }

    if (selectedProfile) {
        msg.workerId = selectedProfile.workerId;
        msg.status = 'queued';
        await msg.save();
        selectedProfile.dailyCount += 1;
        await selectedProfile.save();
        return NextResponse.json({ success: true, queued: true, message: msg });
    }

    return NextResponse.json({ success: true, queued: false, message: msg, error: 'No active workers available' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to send' }, { status: 500 });
  }
}
