import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '../../../../lib/db/mongoose';
import { Message } from '../../../../models/Message';
import { Profile } from '../../../../models/Profile';

// Helper to get simple auth
function checkAuth(req: NextRequest) {
    const bearer = req.headers.get('authorization');
    const secret = process.env.API_SECRET;
    if (!secret) return true; // If no secret configured, allow (for testing)
    const token = bearer?.split(' ')[1];
    return token === secret;
}

export async function GET(req: NextRequest) {
    try {
        if (!checkAuth(req)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const workerId = req.nextUrl.searchParams.get('workerId');
        if (!workerId) {
            return NextResponse.json({ error: 'workerId parameter required' }, { status: 400 });
        }

        await connectToDatabase();

        // Register or update heartbeat
        let profile = await Profile.findOne({ workerId });
        if (!profile) {
            profile = new Profile({ workerId, name: `Mac Worker ${workerId}`, status: 'active' });
        } else {
            profile.lastPing = new Date();
            const now = new Date();
            const lastReset = profile.lastReset || new Date(0);
            if (now.getDate() !== lastReset.getDate() || now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear()) {
                profile.dailyCount = 0;
                profile.lastReset = now;
            }
            // Reconnecting worker — allow recovery after transient failures
            if (profile.status === 'inactive') {
                profile.status = 'active';
                profile.errorThreshold = 0;
            }
        }

        await profile.save();

        // Enforce randomized 15-45s delay between messages.
        // We find the last sent message by this worker and check its timestamp.
        const lastSentMsg = await Message.findOne({ workerId, direction: 'outbound', status: 'sent' }).sort({ updatedAt: -1 });
        if (lastSentMsg) {
            const timeSinceLastSend = Date.now() - lastSentMsg.updatedAt.getTime();
            // To be safe, wait minimum 15 seconds. The worker also has randomized delay locally, but we enforce base delay here.
            // Wait, let's enforce a strict minimum 15s here.
            if (timeSinceLastSend < 15000) {
                // Not enough time passed, return empty
                return NextResponse.json({ actions: [] });
            }
        }

        // Find the next queued message for this worker
        const pendingMsg = await Message.findOneAndUpdate(
            { workerId, status: 'queued', direction: 'outbound' },
            { status: 'pending' }, // temporarily lock it or something? Actually let's just send it. Wait, the worker needs to confirm.
            { sort: { createdAt: 1 } }
        );

        if (!pendingMsg) {
            return NextResponse.json({ actions: [] });
        }

        return NextResponse.json({
            actions: [
                {
                    id: pendingMsg._id,
                    type: 'send_sms',
                    phone: pendingMsg.phone,
                    body: pendingMsg.body,
                    attachments: pendingMsg.attachments || []
                }
            ]
        });

    } catch (error: any) {
        console.error('Error in worker poll:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
