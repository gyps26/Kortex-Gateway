import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '../../../../lib/db/mongoose';
import { Message } from '../../../../models/Message';
import { Profile } from '../../../../models/Profile';
import { GhlLocation } from '../../../../models/GhlLocation';
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
        const { workerId, phone, body: smsBody } = body;

        if (!workerId || !phone || !smsBody) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        await connectToDatabase();

        const profile = await Profile.findOne({ workerId });
        if (!profile || !profile.assignedLocationId) {
            return NextResponse.json({ error: 'Worker unassigned or not found' }, { status: 400 });
        }

        const message = new Message({
            workerId,
            locationId: profile.assignedLocationId,
            phone,
            body: smsBody,
            direction: 'inbound',
            status: 'delivered'
        });

        await message.save();

        // Inject into GoHighLevel v2 API
        const ghlLocation = await GhlLocation.findOne({ locationId: profile.assignedLocationId });
        if (ghlLocation && ghlLocation.accessToken) {
            try {
                await axios.post('https://services.leadconnectorhq.com/conversations/messages/inbound', {
                    type: 'SMS',
                    phone: phone,
                    message: smsBody
                }, {
                    headers: {
                        'Authorization': `Bearer ${ghlLocation.accessToken}`,
                        'Version': '2021-04-15',
                        'Content-Type': 'application/json'
                    }
                });
            } catch (ghlErr: any) {
                console.error('Failed to inject into GHL:', ghlErr.response?.data || ghlErr.message);
            }
        }

        return NextResponse.json({ success: true, messageId: message._id });

    } catch (error: any) {
        console.error('Error handling inbound SMS:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
