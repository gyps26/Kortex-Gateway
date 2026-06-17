import { connectToDatabase } from '../db/mongoose';
import { Message, IMessage } from '../../models/Message';
import { Profile } from '../../models/Profile';
import { GhlLocation } from '../../models/GhlLocation';
import { UserMapping } from '../../models/UserMapping';
import { sendEvolutionTextMessage } from '../whatsapp/evolution';
import { outboundQueue } from '../queue/redis';
import { findAvailableConnector, assignConnectorToMessage } from '../connectors/assign';
import { Channel, CHANNEL_PRIORITY, OutboundPayload } from '../connectors/types';
import { dispatchSmsOutbound } from '../sms/fcm';
import { fetchContact, getValidAccessToken } from '../ghl';
import { IProfile } from '../../models/Profile';

const OUTBOUND_JOB_NAME = 'send-outbound';

async function resolveChannel(payload: OutboundPayload): Promise<Channel> {
  if (payload.channel) {
    return payload.channel;
  }

  await connectToDatabase();

  const location = await GhlLocation.findOne({ locationId: payload.locationId });
  if (location?.defaultChannel) {
    const connector = await findAvailableConnector(payload.locationId, location.defaultChannel);
    if (connector) return location.defaultChannel;
  }

  for (const channel of CHANNEL_PRIORITY) {
    const connector = await findAvailableConnector(payload.locationId, channel);
    if (connector) return channel;
  }

  return 'IMESSAGE';
}

async function resolveWorkerForMessage(message: IMessage, channel: Channel): Promise<IProfile | null> {
  const location = await GhlLocation.findOne({ locationId: message.locationId });
  if (!location) return null;

  let userId = message.ghlUserId;

  // 1. If no userId provided, try to fetch the assignedTo user from GHL contact
  if (!userId && message.ghlContactId) {
    const token = await getValidAccessToken(location);
    if (token) {
      const contact = await fetchContact(message.ghlContactId, token);
      if (contact && contact.assignedTo) {
        userId = contact.assignedTo;
      }
    }
  }

  // 2. If we have a userId, check UserMapping
  if (userId) {
    const mapping = await UserMapping.findOne({
      ghlLocationId: message.locationId,
      ghlUserId: userId,
      channelType: channel
    });
    
    if (mapping) {
      const mappedProfile = await Profile.findOne({ workerId: mapping.providerId, status: 'active' });
      if (mappedProfile) return mappedProfile; // Bypass load balancer
    }
  }

  // 3. Fallback to Location Default for this channel
  if (channel === 'SMS' && location.defaultSmsWorkerId) {
    const defaultProfile = await Profile.findOne({ workerId: location.defaultSmsWorkerId, status: 'active' });
    if (defaultProfile) return defaultProfile;
  }
  
  if (channel === 'WHATSAPP' && location.defaultWhatsappWorkerId) {
    const defaultProfile = await Profile.findOne({ workerId: location.defaultWhatsappWorkerId, status: 'active' });
    if (defaultProfile) return defaultProfile;
  }

  // 4. Fallback to standard load-balancer (round-robin)
  return await findAvailableConnector(message.locationId!, channel);
}

async function dispatchToChannel(message: IMessage, channel: Channel): Promise<IMessage> {
  console.log(`[DISPATCH] Resolving worker for message ${message._id} channel=${channel} locationId=${message.locationId}`);
  const connector = await resolveWorkerForMessage(message, channel);

  if (!connector) {
    console.warn(`[DISPATCH] No active ${channel} connector for location ${message.locationId}. Check: 1) Profile exists with channel=${channel}, status=active, assignedLocationId=${message.locationId}. 2) defaultWhatsappWorkerId or defaultSmsWorkerId is set on the GhlLocation.`);
    throw new Error(`No available ${channel} connector`);
  }

  console.log(`[DISPATCH] Resolved worker: ${connector.workerId} (name: ${connector.name}, status: ${connector.status}, channel: ${connector.channel})`);

  const { workerId } = await assignConnectorToMessage(connector);
  message.channel = channel;
  message.workerId = workerId;
  message.deviceId = workerId;

  if (channel === 'IMESSAGE') {
    message.status = 'queued';
    await message.save();
    return message;
  }

  if (channel === 'WHATSAPP') {
    message.status = 'pending';
    await message.save();

    try {
      const apiKey = process.env.EVOLUTION_API_KEY || '';
      const instanceName = workerId; // Since we resolved the specific worker, its ID is the instance name

      console.log(`[WHATSAPP DISPATCH] Sending to ${message.phone} via instance "${instanceName}" (workerId: ${workerId})`);

      const result = await sendEvolutionTextMessage(
        message.phone,
        message.body,
        instanceName,
        apiKey
      );

      console.log(`[WHATSAPP DISPATCH] Success:`, JSON.stringify(result).substring(0, 200));
      message.status = 'sent';
      await message.save();
    } catch (error: any) {
      console.error(`[WHATSAPP DISPATCH] FAILED for instance "${workerId}":`, error.response?.data || error.message);
      message.status = 'failed';
      message.errorDetails = error.response?.data ? JSON.stringify(error.response.data) : error.message;
      await message.save();
    }

    return message;
  }

  if (channel === 'SMS') {
    message.status = 'pending';
    await message.save();
    await dispatchSmsOutbound(message, connector);
    return message;
  }

  await message.save();
  return message;
}

export async function createOutboundMessage(payload: OutboundPayload): Promise<IMessage> {
  await connectToDatabase();

  const channel = await resolveChannel(payload);

  const message = await Message.create({
    ghlContactId: payload.contactId,
    ghlMessageId: payload.ghlMessageId,
    ghlUserId: payload.userId,
    locationId: payload.locationId,
    phone: payload.phone,
    body: payload.body,
    attachments: payload.attachments || [],
    direction: 'outbound',
    status: 'pending',
    channel,
  });

  if (outboundQueue) {
    await outboundQueue.add(
      OUTBOUND_JOB_NAME,
      { messageId: message._id.toString() },
      {
        removeOnComplete: true,
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
      }
    );
    return message;
  }

  await dispatchToChannel(message, channel);
  return message;
}

export async function processOutboundJob(messageId: string): Promise<IMessage | null> {
  await connectToDatabase();

  const message = await Message.findById(messageId);
  if (!message) return null;

  const channel = message.channel || (await resolveChannel({
    phone: message.phone,
    body: message.body,
    locationId: message.locationId!,
  }));

  if (!message.channel) {
    message.channel = channel;
    await message.save();
  }

  return dispatchToChannel(message, channel);
}

export { OUTBOUND_JOB_NAME };
