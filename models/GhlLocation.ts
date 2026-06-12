import mongoose from 'mongoose';

export interface IGhlLocation extends mongoose.Document {
  locationId: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  companyName?: string;
  updatedAt: Date;
}

const ghlLocationSchema = new mongoose.Schema<IGhlLocation>({
  locationId: { type: String, required: true, unique: true },
  accessToken: { type: String, required: true },
  refreshToken: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  companyName: { type: String },
  updatedAt: { type: Date, default: Date.now }
});

export const GhlLocation = mongoose.models.GhlLocation || mongoose.model<IGhlLocation>('GhlLocation', ghlLocationSchema);
