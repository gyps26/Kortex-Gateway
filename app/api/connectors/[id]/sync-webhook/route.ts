import { NextResponse } from 'next/server';
import { connectToDatabase } from '../../../../../lib/db/mongoose';
import { Profile } from '../../../../../models/Profile';
import { registerEvolutionWebhookForProfile, getWhatsAppWebhookUrl } from '../../../../../lib/whatsapp/webhook';

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  await connectToDatabase();
  const { id } = await params;

  const profile = await Profile.findOne({ workerId: id, channel: 'WHATSAPP' });
  if (!profile) {
    return NextResponse.json({ error: 'Connector not found' }, { status: 404 });
  }

  const webhookRegistered = await registerEvolutionWebhookForProfile(profile);

  return NextResponse.json({
    success: webhookRegistered,
    webhookUrl: getWhatsAppWebhookUrl(),
    workerId: id,
    instanceName: profile.instanceName || id,
  });
}
