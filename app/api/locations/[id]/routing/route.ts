import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '../../../../../lib/db/mongoose';
import { GhlLocation } from '../../../../../models/GhlLocation';
import { UserMapping } from '../../../../../models/UserMapping';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await connectToDatabase();

    const location = await GhlLocation.findOne({ locationId: id });
    if (!location) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 });
    }

    const mappings = await UserMapping.find({ ghlLocationId: id });

    return NextResponse.json({
      location: {
        defaultSmsWorkerId: location.defaultSmsWorkerId || '',
        defaultWhatsappWorkerId: location.defaultWhatsappWorkerId || '',
      },
      mappings,
    });
  } catch (error: any) {
    console.error('Error fetching routing config:', error.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    await connectToDatabase();

    const location = await GhlLocation.findOne({ locationId: id });
    if (!location) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 });
    }

    if (body.defaultSmsWorkerId !== undefined) location.defaultSmsWorkerId = body.defaultSmsWorkerId;
    if (body.defaultWhatsappWorkerId !== undefined) location.defaultWhatsappWorkerId = body.defaultWhatsappWorkerId;
    await location.save();

    if (body.mappings && Array.isArray(body.mappings)) {
      // Clear existing mappings for this location to do a clean overwrite
      await UserMapping.deleteMany({ ghlLocationId: id });
      
      const newMappings = body.mappings.filter((m: any) => m.providerId).map((m: any) => ({
        ghlLocationId: id,
        ghlUserId: m.ghlUserId,
        channelType: m.channelType,
        providerId: m.providerId,
        providerNumber: m.providerNumber || m.providerId, // Fallback if number isn't explicitly passed
      }));

      if (newMappings.length > 0) {
        await UserMapping.insertMany(newMappings);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error saving routing config:', error.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
