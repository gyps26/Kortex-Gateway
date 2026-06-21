import axios from 'axios';
import { IGhlLocation } from '../models/GhlLocation';
import { GlobalSettings } from '../models/GlobalSettings';
import { connectToDatabase } from './db/mongoose';
export async function getValidAccessToken(location: IGhlLocation): Promise<string | null> {
  if (location.expiresAt > new Date(Date.now() + 60_000)) {
    return location.accessToken;
  }
  await connectToDatabase();
  const settings = await GlobalSettings.findOne({});
  if (!settings || !settings.ghlClientId || !settings.ghlClientSecret) {
    return location.accessToken;
  }
  try {
    const res = await axios.post(
      'https://services.leadconnectorhq.com/oauth/token',
      new URLSearchParams({
        client_id: settings.ghlClientId,
        client_secret: settings.ghlClientSecret,
        grant_type: 'refresh_token',
        refresh_token: location.refreshToken,
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    location.accessToken = res.data.access_token;
    if (res.data.refresh_token) {
      location.refreshToken = res.data.refresh_token;
    }
    location.expiresAt = new Date(Date.now() + res.data.expires_in * 1000);
    await location.save();
    return location.accessToken;
  } catch (error: unknown) {
    const err = error as { response?: { data?: unknown }; message?: string };
    console.error('Failed to refresh GHL token:', err.response?.data || err.message);
    return null;
  }
}
export async function fetchLocationDetails(locationId: string, accessToken: string): Promise<{ name?: string; companyId?: string }> {
  try {
    const res = await axios.get(`https://services.leadconnectorhq.com/locations/${locationId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Version: '2021-07-28',
      },
    });
    const location = res.data?.location || res.data;
    return {
      name: location?.name,
      companyId: location?.companyId,
    };
  } catch {
    return {};
  }
}
/** @deprecated Use fetchLocationDetails instead */
export async function fetchLocationName(locationId: string, accessToken: string): Promise<string | undefined> {
  const details = await fetchLocationDetails(locationId, accessToken);
  return details.name;
}
export async function fetchContact(contactId: string, accessToken: string): Promise<any | null> {
  try {
    const res = await axios.get(`https://services.leadconnectorhq.com/contacts/${contactId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Version: '2021-07-28',
      },
    });
    return res.data?.contact || null;
  } catch (error: any) {
    console.error('Failed to fetch GHL contact:', error.response?.data || error.message);
    return null;
  }
}
export async function fetchUsers(locationId: string, accessToken: string, companyId?: string): Promise<any[]> {
  try {
    const params = companyId
      ? `companyId=${companyId}&locationId=${locationId}`
      : `locationId=${locationId}`;
    const res = await axios.get(`https://services.leadconnectorhq.com/users/search?${params}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Version: '2021-07-28',
      },
    });
    return res.data?.users || [];
  } catch (error: any) {
    console.error('Failed to fetch GHL users:', error.response?.data || error.message);
    return [];
  }
}
export async function searchContactByPhone(locationId: string, phone: string, accessToken: string): Promise<string | null> {
  try {
    const res = await axios.get(`https://services.leadconnectorhq.com/contacts/?locationId=${locationId}&query=${encodeURIComponent(phone)}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Version: '2021-07-28',
      },
    });

    const contacts = res.data?.contacts || [];
    if (contacts.length > 0) {
      return contacts[0].id;
    }
    return null;
  } catch (error: any) {
    console.error(`Failed to search GHL contact by phone (${phone}):`, error.response?.data || error.message);
    return null;
  }
}
export async function createContact(locationId: string, phone: string, accessToken: string): Promise<string | null> {
  try {
    const res = await axios.post(
      'https://services.leadconnectorhq.com/contacts/',
      {
        locationId,
        phone,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Version: '2021-07-28',
          'Content-Type': 'application/json',
        },
      }
    );
    return res.data?.contact?.id || null;
  } catch (error: any) {
    console.error(`Failed to create GHL contact for phone (${phone}):`, error.response?.data || error.message);
    return null;
  }
}