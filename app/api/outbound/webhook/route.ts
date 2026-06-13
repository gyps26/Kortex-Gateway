import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { connectToDatabase } from '../../../../lib/db/mongoose';
import { Message } from '../../../../models/Message';
import { Profile } from '../../../../models/Profile';

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
    
    // GHL sends sms body differently depending on if it's a Workflow Webhook, Custom Action, or Custom SMS Provider
    const customData = body.customData || {};
    const contactId = body.contact_id || body.contactId || body.contact?.id;
    const phoneNum = body.phone || body.to || customData.phone || body.contact?.phone;
    const msgBody = body.message || body.body || customData.message || customData.body;
    const locId = body.location_id || body.locationId || body.location?.id;
    const ghlMsgId = body.messageId || body.message_id || `wf_${Date.now()}`;
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

    // 2. Assign to active Mac Worker immediately
    const activeProfiles = await Profile.find({ 
        status: 'active',
        assignedLocationId: locId
    }).sort({ lastPing: -1 });

    let selectedProfile = null;
    for (const profile of activeProfiles) {
        const now = new Date();
        const lastReset = profile.lastReset || new Date(0);
        if (now.getDate() !== lastReset.getDate() || now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear()) {
            profile.dailyCount = 0;
            profile.lastReset = now;
            await profile.save();
        }

        if (profile.dailyCount < (profile.dailyLimit || 50)) {
            selectedProfile = profile;
            break;
        }
    }

    if (selectedProfile) {
        newMessage.workerId = selectedProfile.workerId;
        newMessage.status = 'queued';
        await newMessage.save();
        
        selectedProfile.dailyCount += 1;
        await selectedProfile.save();
    } else {
        console.warn(`No active Mac Workers available for location ${locId} to process message!`);
    }

    return NextResponse.json({ success: true, messageId: newMessage._id });

  } catch (error: any) {
    console.error('Outbound Webhook Error:', error.message);
    return NextResponse.json({ error: 'Failed to process webhook' }, { status: 500 });
  }
}
