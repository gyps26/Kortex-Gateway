import mongoose, { Schema, Document } from 'mongoose';

export interface IGhlAuth extends Document {
  locationId: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const GhlAuthSchema = new Schema<IGhlAuth>(
  {
    locationId: { type: String, required: true, unique: true },
    accessToken: { type: String, required: true },
    refreshToken: { type: String, required: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

export const GhlAuth = mongoose.models.GhlAuth || mongoose.model<IGhlAuth>('GhlAuth', GhlAuthSchema);
