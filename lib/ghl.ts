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

export async function fetchLocationName(locationId: string, accessToken: string): Promise<string | undefined> {
  try {
    const res = await axios.get(`https://services.leadconnectorhq.com/locations/${locationId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Version: '2021-07-28',
      },
    });
    return res.data?.location?.name || res.data?.name;
  } catch {
    return undefined;
  }
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

export async function fetchUsers(locationId: string, accessToken: string): Promise<any[]> {
  try {
    const res = await axios.get(`https://services.leadconnectorhq.com/users/search?locationId=${locationId}`, {
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
