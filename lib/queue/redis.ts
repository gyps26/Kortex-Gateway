import IORedis from 'ioredis';
import { Queue } from 'bullmq';
import { connectToDatabase } from '../db/mongoose';
import { Message } from '../../models/Message';
import { Profile } from '../../models/Profile';
import { processOutboundJob } from '../routing/channelRouter';

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
      tls: requireTls ? { rejectUnauthorized: false } : undefined,
    });
    connection.on('error', (err) => console.error('Redis connection error:', err));
  } catch (err) {
    console.error('Invalid REDIS_URL provided:', err);
  }
}

export const registerStaleChecker = () => {
  const interval = setInterval(async () => {
    try {
      await connectToDatabase();

      // Log devices with stale pings but do NOT change their status.
      // Device liveness is determined at message-send time: if dispatch fails, the
      // message is marked 'failed' and the error details indicate why.
      const staleThreshold = new Date(Date.now() - 300000);
      const staleDevices = await Profile.find({
        status: 'active',
        lastPing: { $lt: staleThreshold },
        channel: { $in: ['WHATSAPP', 'SMS'] },
      });

      for (const profile of staleDevices) {
        const minutesAgo = ((Date.now() - new Date(profile.lastPing).getTime()) / 60000).toFixed(0);
        console.warn(`[STALE] ${profile.channel} profile ${profile.workerId} has not pinged in ${minutesAgo}min (status kept as active).`);
      }

      // Recover stuck pending messages (>5 minutes old) — safety net in case
      // a dispatch error left the message in pending state.
      const stuckThreshold = new Date(Date.now() - 300000);
      const stuckMessages = await Message.find({
        status: 'pending',
        createdAt: { $lt: stuckThreshold },
      });

      for (const msg of stuckMessages) {
        console.warn(`[STALE] Re-dispatching stuck pending message ${msg._id} (created ${msg.createdAt.toISOString()})`);
        msg.workerId = undefined;
        msg.deviceId = undefined;
        await msg.save();
        processOutboundJob(msg._id.toString()).catch(e =>
          console.error(`[STALE] Failed to re-dispatch message ${msg._id}:`, e)
        );
      }
    } catch (e) {
      console.error('Error in stale checker:', e);
    }
  }, 30000);

  return interval;
};

export function getRedisConnection(): IORedis | null {
  return connection;
}

let _outboundQueue: Queue | null = null;

export function getOutboundQueue(): Queue | null {
  if (!_outboundQueue && connection) {
    _outboundQueue = new Queue('outbound', { connection });
  }
  return _outboundQueue;
}



export { connection };
