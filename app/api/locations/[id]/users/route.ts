import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '../../../../../lib/db/mongoose';
import { GhlLocation } from '../../../../../models/GhlLocation';
import { getValidAccessToken, fetchUsers } from '../../../../../lib/ghl';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await connectToDatabase();

    const location = await GhlLocation.findOne({ locationId: id });
    if (!location) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 });
    }

    const token = await getValidAccessToken(location);
    if (!token) {
      return NextResponse.json({ error: 'Invalid or expired GHL token' }, { status: 401 });
    }

    const users = await fetchUsers(id, token);
    return NextResponse.json({ users });
  } catch (error: any) {
    console.error('Error fetching location users:', error.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
