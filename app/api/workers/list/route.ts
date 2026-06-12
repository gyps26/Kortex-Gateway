import { NextResponse } from 'next/server';
import { connectToDatabase } from '../../../../lib/db/mongoose';
import { Profile } from '../../../../models/Profile';

export async function GET() {
    try {
        await connectToDatabase();
        const profiles = await Profile.find({}).sort({ lastPing: -1 });
        return NextResponse.json({ profiles });
    } catch (error: any) {
        console.error('Error fetching workers:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
