import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '../../../../../lib/db/mongoose';
import { GhlLocation } from '../../../../../models/GhlLocation';
import { Profile } from '../../../../../models/Profile';
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
      // Validate each mapping references a real device assigned to this location
      const validMappings: any[] = [];
      for (const m of body.mappings) {
        if (!m.providerId) continue;
        const device = await Profile.findOne({ workerId: m.providerId, assignedLocationId: id });
        if (!device) {
          console.warn(`[ROUTING] Skipping mapping for user ${m.ghlUserId} — device ${m.providerId} not found or not assigned to location ${id}`);
          continue;
        }
        validMappings.push({
          ghlLocationId: id,
          ghlUserId: m.ghlUserId,
          channelType: m.channelType,
          providerId: m.providerId,
          providerNumber: m.providerNumber || device.name || m.providerId,
        });
      }

      // Clear existing mappings and insert valid ones
      await UserMapping.deleteMany({ ghlLocationId: id });

      if (validMappings.length > 0) {
        await UserMapping.insertMany(validMappings);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error saving routing config:', error.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
