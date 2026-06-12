import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '../../../../lib/db/mongoose';
import { GhlLocation } from '../../../../models/GhlLocation';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        await connectToDatabase();
        const locations = await GhlLocation.find({}).sort({ updatedAt: -1 });
        return NextResponse.json({ success: true, locations });
    } catch (error: any) {
        console.error('Error fetching locations:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
