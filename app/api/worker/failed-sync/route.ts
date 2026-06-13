import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '../../../../lib/db/mongoose';
import { Message } from '../../../../models/Message';
import { GhlLocation } from '../../../../models/GhlLocation';
import { getValidAccessToken } from '../../../../lib/ghl';
import axios from 'axios';

function checkAuth(req: NextRequest) {
    const bearer = req.headers.get('authorization');
    const secret = process.env.API_SECRET;
    if (!secret) return true;
    const token = bearer?.split(' ')[1];
    return token === secret;
}

export async function POST(req: NextRequest) {
    try {
        if (!checkAuth(req)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { workerId, phone, body: smsText } = body;

        if (!workerId || !phone || !smsText) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        await connectToDatabase();

        // Find a recent message with the same phone and text that is currently marked as sent or pending/queued
        // Check within the last 24 hours just in case
        const msg = await Message.findOne({
            phone,
            body: smsText,
            direction: 'outbound',
            status: { $in: ['sent', 'delivered', 'pending', 'queued'] },
            createdAt: { $gt: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        }).sort({ createdAt: -1 });

        if (!msg) {
            return NextResponse.json({ error: 'Original message not found' }, { status: 404 });
        }

        msg.status = 'failed';
        msg.errorDetails = 'failed_delivery';
        await msg.save();

        // Sync status back to GHL Custom Provider
        if (msg.ghlMessageId && msg.locationId) {
            const ghlLocation = await GhlLocation.findOne({ locationId: msg.locationId });
            const accessToken = ghlLocation ? await getValidAccessToken(ghlLocation) : null;
            if (accessToken) {
                try {
                    await axios.put(`https://services.leadconnectorhq.com/conversations/messages/${msg.ghlMessageId}/status`, {
                        status: 'undelivered',
                        error: { code: 400, message: 'Message failed to deliver natively via Mac.' }
                    }, {
                        headers: {
                            'Authorization': `Bearer ${accessToken}`,
                            'Version': '2021-04-15',
                            'Content-Type': 'application/json'
                        }
                    });
                } catch (e: any) {
                    console.error('Failed to sync delayed failure status to GHL:', e.response?.data || e.message);
                }
            }
        }

        return NextResponse.json({ success: true, messageId: msg._id });

    } catch (error: any) {
        console.error('Error handling delayed failure sync:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
