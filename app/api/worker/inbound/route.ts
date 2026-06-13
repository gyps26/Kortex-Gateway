import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '../../../../lib/db/mongoose';
import { Message } from '../../../../models/Message';
import { Profile } from '../../../../models/Profile';
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
        const { workerId, phone, body: smsBody, isFromMe } = body;

        if (!workerId || !phone || !smsBody) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        await connectToDatabase();

        const profile = await Profile.findOne({ workerId });
        if (!profile || !profile.assignedLocationId) {
            return NextResponse.json({ error: 'Worker unassigned or not found' }, { status: 400 });
        }

        let shouldInject = true;

        if (isFromMe) {
            const recentOutbound = await Message.findOne({
                phone,
                body: smsBody,
                direction: 'outbound',
                createdAt: { $gt: new Date(Date.now() - 120000) }
            });
            if (recentOutbound) {
                shouldInject = false;
                return NextResponse.json({ success: true, messageId: recentOutbound._id });
            }
        }

        const message = new Message({
            workerId,
            locationId: profile.assignedLocationId,
            phone,
            body: smsBody,
            direction: isFromMe ? 'outbound' : 'inbound',
            status: 'delivered'
        });

        await message.save();

        if (shouldInject) {
            const ghlLocation = await GhlLocation.findOne({ locationId: profile.assignedLocationId });
            const accessToken = ghlLocation ? await getValidAccessToken(ghlLocation) : null;
            if (accessToken) {
                try {
                    const payload: any = {
                        type: 'SMS',
                        phone: phone,
                        message: smsBody,
                        conversationProviderId: profile.assignedLocationId // Required by GHL for Custom Providers
                    };
                    
                    if (isFromMe) {
                         payload.direction = 'outbound';
                    }

                    try {
                        await axios.post('https://services.leadconnectorhq.com/conversations/messages/inbound', payload, {
                            headers: {
                                'Authorization': `Bearer ${accessToken}`,
                                'Version': '2021-04-15',
                                'Content-Type': 'application/json'
                            }
                        });
                    } catch (err: any) {
                        // If it failed because of a schema error with "direction", fallback to standard inbound
                        if (isFromMe && err.response && err.response.status === 400) {
                            console.warn('GHL rejected outbound direction for inbound endpoint. Retrying as standard inbound...');
                            delete payload.direction;
                            await axios.post('https://services.leadconnectorhq.com/conversations/messages/inbound', payload, {
                                headers: {
                                    'Authorization': `Bearer ${accessToken}`,
                                    'Version': '2021-04-15',
                                    'Content-Type': 'application/json'
                                }
                            });
                        } else {
                            throw err;
                        }
                    }
                } catch (ghlErr: any) {
                    console.error('Failed to inject into GHL:', ghlErr.response?.data || ghlErr.message);
                }
            }
        }

        return NextResponse.json({ success: true, messageId: message._id });

    } catch (error: any) {
        console.error('Error handling inbound SMS:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
