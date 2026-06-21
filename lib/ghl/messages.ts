import axios from 'axios';
import { GhlLocation } from '../../models/GhlLocation';
import { getValidAccessToken, searchContactByPhone, createContact } from '../ghl';
export async function injectInbound(params: {
  locationId: string;
  phone: string;
  message: string;
  conversationProviderId?: string;
  direction?: 'outbound';
  channel?: 'IMESSAGE' | 'WHATSAPP' | 'SMS';
}): Promise<void> {
  const ghlLocation = await GhlLocation.findOne({ locationId: params.locationId });
  if (!ghlLocation) {
    throw new Error(`GHL location not found for locationId: ${params.locationId}. Complete OAuth for this location first.`);
  }
  const accessToken = await getValidAccessToken(ghlLocation);
  if (!accessToken) {
    throw new Error(`No valid GHL access token for locationId: ${params.locationId}. Token may be expired or OAuth not completed.`);
  }
  let contactId = await searchContactByPhone(params.locationId, params.phone, accessToken);
  if (!contactId) {
    console.log(`Contact not found for phone ${params.phone}. Creating new contact...`);
    contactId = await createContact(params.locationId, params.phone, accessToken);
  }
  if (!contactId) {
    console.warn(`GHL Injection skipped: Failed to create or find contact for phone ${params.phone} in location ${params.locationId}`);
    return;
  }
  let providerId = params.conversationProviderId || params.locationId;
  if (!params.conversationProviderId) {
    if (params.channel === 'WHATSAPP') {
      providerId = '6a302ff401711da42e91e7fc';
    } else if (params.channel === 'SMS') {
      providerId = '6a302fd70da1421315aa6870';
    }
  }
  const payload: Record<string, string> = {
    type: 'Custom',
    contactId: contactId,
    message: params.message,
    conversationProviderId: providerId,
  };


  try {
    await axios.post('https://services.leadconnectorhq.com/conversations/messages/inbound', payload, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Version: '2021-04-15',
        'Content-Type': 'application/json',
      },
    });
  } catch (err: unknown) {

    throw err;
  }
}

export async function updateMessageStatus(params: {
  locationId: string;
  ghlMessageId: string;
  status: 'sent' | 'delivered' | 'failed';
  errorDetails?: string;
}): Promise<void> {
  const ghlLocation = await GhlLocation.findOne({ locationId: params.locationId });
  const accessToken = ghlLocation ? await getValidAccessToken(ghlLocation) : null;
  if (!accessToken) return;
  const ghlStatus = params.status === 'failed' ? 'failed' : 'delivered';
  await axios.put(
    `https://services.leadconnectorhq.com/conversations/messages/${params.ghlMessageId}/status`,
    {
      status: ghlStatus,
      error: params.errorDetails ? { code: "400", message: params.errorDetails } : undefined,
    },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Version: '2021-04-15',
        'Content-Type': 'application/json',
      },
    }
  );
}
export async function tagNoWhatsApp(locationId: string, contactId: string): Promise<void> {
  const ghlLocation = await GhlLocation.findOne({ locationId });
  if (!ghlLocation) throw new Error(`GHL location not found for locationId: ${locationId}`);
  const accessToken = await getValidAccessToken(ghlLocation);
  if (!accessToken) throw new Error(`No valid GHL access token for locationId: ${locationId}`);
  await axios.post(
    `https://services.leadconnectorhq.com/contacts/${contactId}/tags`,
    { tags: ['NO-WHATSAPP'] },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Version: '2021-07-28',
        'Content-Type': 'application/json',
      },
    }
  );
}
export async function tagNonIMessage(locationId: string, contactId: string): Promise<void> {
  const ghlLocation = await GhlLocation.findOne({ locationId });
  const accessToken = ghlLocation ? await getValidAccessToken(ghlLocation) : null;
  if (!accessToken) return;

  await axios.post(
    `https://services.leadconnectorhq.com/contacts/${contactId}/tags`,
    { tags: ['Non-iPhone'] },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Version: '2021-07-28',
        'Content-Type': 'application/json',
      },
    }
  );
}
