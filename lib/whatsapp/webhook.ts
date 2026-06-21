import axios from 'axios';

const EVOLUTION_API_BASE_URL = 'https://evoapi.gokortex.com';

export function getAppWebhookBaseUrl(): string {
  const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || '';
  return appUrl.replace(/\/$/, '');
}

export function getWhatsAppWebhookUrl(): string | null {
  const base = getAppWebhookBaseUrl();
  if (!base) return null;
  return `${base}/api/webhooks/whatsapp`;
}

export async function registerEvolutionWebhook(instanceName: string): Promise<boolean> {
  const webhookUrl = getWhatsAppWebhookUrl();
  if (!webhookUrl) {
    console.warn(`[WhatsApp] APP_URL not set — cannot register webhook for ${instanceName}`);
    return false;
  }

  const apiKey = process.env.EVOLUTION_API_KEY || '';
  if (!apiKey) {
    console.warn(`[WhatsApp] EVOLUTION_API_KEY not set — cannot register webhook for ${instanceName}`);
    return false;
  }

  try {
    await axios.post(
      `${EVOLUTION_API_BASE_URL}/webhook/set/${instanceName}`,
      {
        webhook: {
          enabled: true,
          url: webhookUrl,
          byEvents: false,
          base64: false,
          events: ['MESSAGES_UPSERT', 'CONNECTION_UPDATE'],
        },
      },
      { headers: { apikey: apiKey } }
    );
    console.log(`[WhatsApp] Registered webhook for ${instanceName} → ${webhookUrl}`);
    return true;
  } catch (err: unknown) {
    const error = err as { response?: { data?: unknown }; message?: string };
    console.error(
      `[WhatsApp] Failed to register webhook for ${instanceName}:`,
      error.response?.data || error.message
    );
    return false;
  }
}

export async function registerEvolutionWebhookForProfile(profile: any): Promise<boolean> {
  const instanceName = profile.instanceName || profile.workerId;
  return registerEvolutionWebhook(instanceName);
}
