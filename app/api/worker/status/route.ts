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
        const { workerId, messageId, status, errorDetails } = body;

        if (!workerId || !messageId || !status) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        await connectToDatabase();

        const msg = await Message.findById(messageId);
        if (!msg) {
            return NextResponse.json({ error: 'Message not found' }, { status: 404 });
        }

        msg.status = status;
        if (errorDetails) {
            msg.errorDetails = errorDetails;
        }
        await msg.save();

        // Sync status back to GHL Custom Provider
        if (msg.ghlMessageId && msg.locationId && ['sent', 'delivered', 'failed'].includes(status)) {
            const ghlLocation = await GhlLocation.findOne({ locationId: msg.locationId });
            if (ghlLocation && ghlLocation.accessToken) {
                try {
                    await axios.put(`https://services.leadconnectorhq.com/conversations/messages/${msg.ghlMessageId}/status`, {
                        status: status === 'failed' ? 'undelivered' : 'delivered',
                        error: errorDetails ? { code: 400, message: errorDetails } : undefined
                    }, {
                        headers: {
                            'Authorization': `Bearer ${ghlLocation.accessToken}`,
                            'Version': '2021-04-15',
                            'Content-Type': 'application/json'
                        }
                    });
                } catch (e: any) {
                    console.error('Failed to sync status to GHL:', e.response?.data || e.message);
                }
            }
        }

        // If AppleScript failed, handle telemetry to mark profile inactive
        if (status === 'failed') {
            if (errorDetails === 'failed_not_imessage' && msg.ghlContactId && msg.locationId) {
                // Do not increment errorThreshold for this because it's a lead issue, not a worker issue
                // Tag the contact in GoHighLevel
                const ghlLocation = await GhlLocation.findOne({ locationId: msg.locationId });
                if (ghlLocation && ghlLocation.accessToken) {
                    try {
                        await axios.post(`https://services.leadconnectorhq.com/contacts/${msg.ghlContactId}/tags`, {
                            tags: ['Non-iPhone']
                        }, {
                            headers: {
                                'Authorization': `Bearer ${ghlLocation.accessToken}`,
                                'Version': '2021-07-28',
                                'Content-Type': 'application/json'
                            }
                        });
                        console.log(`Successfully tagged contact ${msg.ghlContactId} as Non-iPhone`);
                    } catch (err: any) {
                        console.error('Failed to tag contact in GHL:', err.response?.data || err.message);
                    }
                }
            } else {
                const profile = await Profile.findOne({ workerId });
                if (profile) {
                    profile.errorThreshold += 1;
                    if (profile.errorThreshold >= 3) {
                        profile.status = 'inactive';
                        console.warn(`Profile ${workerId} marked inactive due to repeated failures!`);
                    }
                    await profile.save();
                }
            }
        } else if (status === 'sent') {
            const profile = await Profile.findOne({ workerId });
            if (profile) {
                profile.errorThreshold = 0; // reset on success
                await profile.save();
            }
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Error updating worker status:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
