import mongoose from 'mongoose';

export interface IGhlLocation extends mongoose.Document {
  locationId: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  companyName?: string;
  companyId?: string;
  defaultChannel?: 'IMESSAGE' | 'WHATSAPP' | 'SMS';
  defaultSmsWorkerId?: string;
  defaultWhatsappWorkerId?: string;
  updatedAt: Date;
}

const ghlLocationSchema = new mongoose.Schema<IGhlLocation>({
  locationId: { type: String, required: true, unique: true },
  accessToken: { type: String, required: true },
  refreshToken: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  companyName: { type: String },
  companyId: { type: String },
  defaultChannel: { type: String, enum: ['IMESSAGE', 'WHATSAPP', 'SMS'] },
  defaultSmsWorkerId: { type: String },
  defaultWhatsappWorkerId: { type: String },
  updatedAt: { type: Date, default: Date.now }
});

export const GhlLocation = mongoose.models.GhlLocation || mongoose.model<IGhlLocation>('GhlLocation', ghlLocationSchema);
