import { Queue, Worker, QueueEvents } from 'bullmq';
import IORedis from 'ioredis';
import { connectToDatabase } from '../db/mongoose';
import { Message } from '../../models/Message';
import { Profile } from '../../models/Profile';

const REDIS_URL = process.env.REDIS_URL;

let connection: IORedis | null = null;
if (REDIS_URL) {
  try {
    let urlStr = REDIS_URL.includes('-u ') ? REDIS_URL.split('-u ')[1].trim() : REDIS_URL.trim();
    const isUpstash = urlStr.includes('upstash.io');
    const requireTls = REDIS_URL.includes('--tls') || isUpstash;
    if (requireTls && urlStr.startsWith('redis://')) {
        urlStr = urlStr.replace('redis://', 'rediss://');
    }
    connection = new IORedis(urlStr, { 
      maxRetriesPerRequest: null,
      tls: requireTls ? { rejectUnauthorized: false } : undefined
    });
    connection.on('error', (err) => console.error('Redis connection error:', err));
  } catch (err) {
    console.error('Invalid REDIS_URL provided:', err);
  }
}

export const outboundQueue = connection ? new Queue('outboundMessages', { connection: connection as any }) : null;

export const setupWorker = () => {
    if (!connection) return null;

    // Stale Node Recovery Interval (every 10 seconds)
    setInterval(async () => {
        try {
            await connectToDatabase();
            const threshold = new Date(Date.now() - 15000); // 15 seconds
            const staleProfiles = await Profile.find({
                status: 'active',
                lastPing: { $lt: threshold }
            });
            
            for (const profile of staleProfiles) {
                profile.status = 'inactive';
                await profile.save();
                console.log(`Profile ${profile.workerId} marked offline due to inactivity.`);
                
                // Re-queue any messages stuck in 'queued' for this offline worker
                const messagesToRequeue = await Message.find({ workerId: profile.workerId, status: 'queued' });
                for (const m of messagesToRequeue) {
                     m.status = 'pending';
                     m.workerId = undefined;
                     await m.save();
                     if (outboundQueue) await outboundQueue.add('send_sms', { messageId: m._id });
                }
            }
        } catch (e) {
            console.error('Error checking stale nodes', e);
        }
    }, 10000);

    const worker = new Worker('outboundMessages', async (job) => {
        await connectToDatabase();
        
        const { messageId } = job.data;
        const msg = await Message.findById(messageId);
        if (!msg) return;

        // Query active profiles assigned to this message's location_id
        const activeProfiles = await Profile.find({ 
            status: 'active',
            assignedLocationId: msg.locationId // Load balance only across correct nodes
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
                break; // Round-robin achieved by finding the first one under limit (and recently active)
            }
        }

        if (!selectedProfile) {
            console.warn(`No active profiles available for location ${msg.locationId} or all reached limit.`);
            throw new Error('No available profiles'); // Re-queue
        }

        // Assign to the specific profile
        msg.workerId = selectedProfile.workerId;
        msg.status = 'queued';
        await msg.save();
        
        selectedProfile.dailyCount += 1;
        await selectedProfile.save();

        console.log(`Job ${job.id} assigned to worker ${selectedProfile.workerId}`);
        return msg;

    }, { connection: connection as any, concurrency: 1 });

    worker.on('failed', (job, err) => {
        console.error(`Job ${job?.id} failed:`, err);
    });

    return worker;
};
