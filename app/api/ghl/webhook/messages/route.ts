import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '../../../../../lib/db/mongoose';
import { Message } from '../../../../../models/Message';
import { outboundQueue } from '../../../../../lib/queue/redis';

export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get('authorization') || req.headers.get('x-ghl-webhook-secret');
        const expectedSecret = process.env.GHL_WEBHOOK_SECRET;

        // Basic verification
        if (expectedSecret && authHeader !== expectedSecret) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        /*
          Expected Payload from GHL:
          {
             "phone": "+1234567890",
             "body": "Hello world",
             "contactId": "xxx"
          }
        */

        if (!body.phone || !body.body) {
            return NextResponse.json({ error: 'Missing phone or body' }, { status: 400 });
        }

        await connectToDatabase();

        const message = new Message({
            ghlContactId: body.contactId,
            phone: body.phone,
            body: body.body,
            direction: 'outbound',
            status: 'pending'
        });

        await message.save();

        // Enqueue to BullMQ
        if (outboundQueue) {
            await outboundQueue.add('send-sms', { messageId: message._id }, {
                removeOnComplete: true,
                attempts: 3,
                backoff: { type: 'exponential', delay: 5000 }
            });
        } else {
            console.warn('Redis not configured. Message saved but not queued in BullMQ.');
            // Without BullMQ, you'll need another polling mechanism to assign messages,
            // but we follow the exact reqs by implementing it with BullMQ.
        }

        return NextResponse.json({ success: true, messageId: message._id });
    } catch (error: any) {
        console.error('Error handling GHL webhook:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
