import type { Channel } from '../connectors/types';

export interface ParsedWhatsAppInbound {
  instanceName: string;
  remoteJid: string;
  fromMe: boolean;
  text: string;
  phoneNumber: string;
}

function extractText(message: Record<string, unknown> | undefined): string {
  if (!message) return '';

  const direct = message.conversation;
  if (typeof direct === 'string' && direct.trim()) return direct;

  const extended = message.extendedTextMessage as Record<string, unknown> | undefined;
  if (typeof extended?.text === 'string' && extended.text.trim()) return extended.text;

  const image = message.imageMessage as Record<string, unknown> | undefined;
  if (typeof image?.caption === 'string' && image.caption.trim()) return image.caption;

  const video = message.videoMessage as Record<string, unknown> | undefined;
  if (typeof video?.caption === 'string' && video.caption.trim()) return video.caption;

  const doc = message.documentMessage as Record<string, unknown> | undefined;
  if (typeof doc?.caption === 'string' && doc.caption.trim()) return doc.caption;

  const buttons = message.buttonsResponseMessage as Record<string, unknown> | undefined;
  if (typeof buttons?.selectedDisplayText === 'string' && buttons.selectedDisplayText.trim()) {
    return buttons.selectedDisplayText;
  }

  const list = message.listResponseMessage as Record<string, unknown> | undefined;
  const listTitle = list?.title;
  if (typeof listTitle === 'string' && listTitle.trim()) return listTitle;

  return '';
}

function normalizePhone(remoteJid: string): string {
  const bare = remoteJid.split('@')[0] || remoteJid;
  return bare.replace(/:\d+$/, '');
}

function normalizeEventName(event: unknown): string {
  return String(event || '')
    .toLowerCase()
    .replace(/_/g, '.')
    .replace(/-/g, '.');
}

export function parseWhatsAppWebhookPayload(payload: Record<string, unknown>): ParsedWhatsAppInbound | null {
  const eventName = normalizeEventName(payload.event);
  if (eventName !== 'messages.upsert') return null;

  const instanceName = String(payload.instance || payload.instanceName || '');
  if (!instanceName) return null;

  const rawData = payload.data;
  const entries = Array.isArray(rawData) ? rawData : rawData ? [rawData] : [];

  for (const entry of entries) {
    if (!entry || typeof entry !== 'object') continue;
    const data = entry as Record<string, unknown>;
    const key = data.key as Record<string, unknown> | undefined;
    const remoteJid = String(key?.remoteJid || data.remoteJid || '');
    if (!remoteJid || remoteJid.endsWith('@g.us')) continue;

    const text = extractText(data.message as Record<string, unknown> | undefined);
    if (!text) continue;

    return {
      instanceName,
      remoteJid,
      fromMe: Boolean(key?.fromMe),
      text,
      phoneNumber: normalizePhone(remoteJid),
    };
  }

  return null;
}

export function parseConnectionUpdate(payload: Record<string, unknown>): {
  instanceName: string;
  state: string;
} | null {
  const eventName = normalizeEventName(payload.event);
  if (eventName !== 'connection.update') return null;

  const instanceName = String(payload.instance || payload.instanceName || '');
  const data = payload.data as Record<string, unknown> | undefined;
  const state = String(data?.state || data?.status || '');
  if (!instanceName || !state) return null;

  return { instanceName, state };
}

export const WHATSAPP_CHANNEL: Channel = 'WHATSAPP';
