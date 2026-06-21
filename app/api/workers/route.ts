import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '../../../lib/db/mongoose';
import { Profile } from '../../../models/Profile';
import { GhlLocation } from '../../../models/GhlLocation';
import axios from 'axios';


export async function PUT(req: NextRequest) {
    try {
        const body = await req.json();
        const { workerId, dailyLimit, assignedLocationId, name } = body;

        if (!workerId) {
            return NextResponse.json({ error: 'Missing workerId' }, { status: 400 });
        }

        await connectToDatabase();

        const profile = await Profile.findOne({ workerId });
        if (!profile) {
            return NextResponse.json({ error: 'Worker not found' }, { status: 404 });
        }

        if (assignedLocationId !== undefined) {
          const location = await GhlLocation.findOne({ locationId: assignedLocationId });
          if (!location) {
            return NextResponse.json({ error: 'Location not found. Complete GHL OAuth for this location first.' }, { status: 400 });
          }
          profile.assignedLocationId = assignedLocationId;
        }
        if (dailyLimit !== undefined) profile.dailyLimit = dailyLimit;
        if (name !== undefined) profile.name = name;
        if (body.channel !== undefined) profile.channel = body.channel;

        await profile.save();

        return NextResponse.json({ success: true, profile });
    } catch (error: any) {
        console.error('Error updating worker:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const workerId = searchParams.get('workerId');

        if (!workerId) {
            return NextResponse.json({ error: 'Missing workerId' }, { status: 400 });
        }

        await connectToDatabase();
        
        const profile = await Profile.findOneAndDelete({ workerId });
        if (!profile) {
            return NextResponse.json({ error: 'Worker not found' }, { status: 404 });
        }

        if (profile.channel === 'WHATSAPP') {
            try {
              const evoApiUrl = 'https://evoapi.gokortex.com';
              const apiKey = process.env.EVOLUTION_API_KEY || '';
              await axios.delete(`${evoApiUrl}/instance/delete/${profile.workerId}`, {
                headers: { apikey: apiKey }
              });
            } catch(e:any) {
              console.error('Failed to delete evolution instance:', e.response?.data || e.message);
            }
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting worker:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
