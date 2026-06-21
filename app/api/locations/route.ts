import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '../../../lib/db/mongoose';
import { GhlLocation } from '../../../models/GhlLocation';
import { Profile } from '../../../models/Profile';

export async function DELETE(req: NextRequest) {
  try {
    const locationId = req.nextUrl.searchParams.get('locationId');
    if (!locationId) {
      return NextResponse.json({ error: 'locationId required' }, { status: 400 });
    }

    await connectToDatabase();

    await GhlLocation.deleteOne({ locationId });
    await Profile.updateMany({ assignedLocationId: locationId }, { assignedLocationId: null });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error disconnecting location:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
