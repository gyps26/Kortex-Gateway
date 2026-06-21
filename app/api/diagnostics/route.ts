import { NextResponse } from 'next/server';
import { connectToDatabase } from '../../../lib/db/mongoose';
import { Profile } from '../../../models/Profile';
import { Message } from '../../../models/Message';
import { GhlLocation } from '../../../models/GhlLocation';
import { UserMapping } from '../../../models/UserMapping';
import { getRedisConnection } from '../../../lib/queue/redis';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectToDatabase();

    const redisConn = getRedisConnection();
    let redisPing: boolean | string = 'unknown';
    if (redisConn) {
      try {
        redisPing = await redisConn.ping().then(() => true).catch((e) => `error: ${e.message}`);
      } catch (e: any) {
        redisPing = `error: ${e.message}`;
      }
    } else {
      redisPing = 'no REDIS_URL configured or connection failed';
    }

    const allProfiles = await Profile.find({}).sort({ lastPing: -1 }).lean();
    const allLocations = await GhlLocation.find({}).lean();
    const recentMessages = await Message.find({})
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    const pendingMessages = await Message.countDocuments({ status: 'pending' });
    const queuedMessages = await Message.countDocuments({ status: 'queued' });
    const failedToday = await Message.countDocuments({
      status: 'failed',
      createdAt: { $gte: new Date(Date.now() - 86400000) },
    });

    return NextResponse.json({
      mongodb: {
        state: ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState] || 'unknown',
        dbName: mongoose.connection.db?.databaseName || null,
      },
      redis: {
        configured: !!process.env.REDIS_URL,
        connected: !!redisConn,
        ping: redisPing,
      },
      profiles: {
        total: allProfiles.length,
        byChannel: {
          WHATSAPP: allProfiles.filter(p => p.channel === 'WHATSAPP').length,
          SMS: allProfiles.filter(p => p.channel === 'SMS').length,
          IMESSAGE: allProfiles.filter(p => p.channel === 'IMESSAGE').length,
        },
        byStatus: {
          active: allProfiles.filter(p => p.status === 'active').length,
          inactive: allProfiles.filter(p => p.status === 'inactive').length,
          pending: allProfiles.filter(p => p.status === 'pending').length,
        },
        unassigned: allProfiles.filter(p => !p.assignedLocationId).length,
        assigned: allProfiles.filter(p => p.assignedLocationId).length,
        list: allProfiles.map(p => ({
          workerId: p.workerId,
          name: p.name,
          channel: p.channel,
          status: p.status,
          assignedLocationId: p.assignedLocationId || '(not set)',
          fcmToken: p.fcmToken ? 'SET' : 'NOT SET',
          dailyCount: `${p.dailyCount}/${p.dailyLimit}`,
          lastPing: p.lastPing ? new Date(p.lastPing).toISOString() : 'never',
          errorThreshold: p.errorThreshold,
        })),
      },
      locations: {
        total: allLocations.length,
        list: allLocations.map(l => ({
          locationId: l.locationId,
          companyName: l.companyName || '(unnamed)',
          defaultChannel: l.defaultChannel || '(not set)',
          defaultSmsWorkerId: l.defaultSmsWorkerId || '(not set)',
          defaultWhatsappWorkerId: l.defaultWhatsappWorkerId || '(not set)',
          expiresAt: l.expiresAt ? new Date(l.expiresAt).toISOString() : 'unknown',
          tokenExpired: l.expiresAt ? new Date(l.expiresAt) < new Date() : true,
        })),
      },
      messages: {
        pending: pendingMessages,
        queued: queuedMessages,
        failedToday,
        recent: recentMessages.map(m => ({
          id: m._id?.toString()?.slice(-8),
          channel: m.channel,
          direction: m.direction,
          status: m.status,
          phone: m.phone?.slice(-6),
          body: m.body?.slice(0, 60),
          locationId: m.locationId?.slice(-8) || '?',
          createdAt: m.createdAt?.toISOString(),
          updatedAt: m.updatedAt?.toISOString(),
          workerId: m.workerId || 'not assigned',
          errorDetails: m.errorDetails || null,
        })),
      },
      userMappings: await UserMapping.find({}).lean().then(mappings =>
        mappings.map(m => ({
          ghlLocationId: m.ghlLocationId?.slice(-8),
          ghlUserId: m.ghlUserId?.slice(-8),
          channelType: m.channelType,
          providerId: m.providerId,
        }))
      ),
      env: {
        APP_URL: process.env.APP_URL || '(not set) — WhatsApp webhooks will fail',
        EVOLUTION_API_KEY: process.env.EVOLUTION_API_KEY ? 'SET' : '(not set)',
        GHL_WEBHOOK_SECRET: process.env.GHL_WEBHOOK_SECRET ? 'SET' : '(not set)',
        GHL_CONVERSATION_PROVIDER_ID: process.env.GHL_CONVERSATION_PROVIDER_ID || '(not set)',
        FIREBASE_CONFIGURED: !!(
          process.env.FIREBASE_PROJECT_ID &&
          process.env.FIREBASE_CLIENT_EMAIL &&
          process.env.FIREBASE_PRIVATE_KEY
        ),
        REDIS_URL: process.env.REDIS_URL ? 'SET' : '(not set)',
        MONGODB_URI: process.env.MONGODB_URI ? 'SET' : '(not set)',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
