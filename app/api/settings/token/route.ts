import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    return NextResponse.json({ 
        token: process.env.WORKER_SECRET || 'CHANGE_ME_IN_ENV_WORKER_SECRET' 
    });
}
