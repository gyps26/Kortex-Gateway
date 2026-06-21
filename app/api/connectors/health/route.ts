import { NextResponse } from 'next/server';
import { connectToDatabase } from '../../../../lib/db/mongoose';
import { getRedisConnection } from '../../../../lib/queue/redis';
import axios from 'axios';


export async function GET() {
  try {
    await connectToDatabase();
    const redis = getRedisConnection();
    const redisReachable = redis ? await redis.ping().then(() => true).catch(() => false) : false;

    let evoReachable = false;
    try {
      const res = await axios.get('https://evoapi.gokortex.com/', { timeout: 3000 });
      evoReachable = res.status === 200;
    } catch {}

    return NextResponse.json({
      redisReachable,
      evoReachable,
      workerOnline: evoReachable,
      healthy: redisReachable && evoReachable,
    });
  } catch (error: unknown) {
    console.error('Health check error:', error);
    return NextResponse.json({ redisReachable: false, evoReachable: false, workerOnline: false, healthy: false }, { status: 500 });
  }
}
