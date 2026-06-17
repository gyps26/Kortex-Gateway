import mongoose, { Schema, Document } from 'mongoose';

export interface IUserMapping extends Document {
  ghlLocationId: string;
  ghlUserId: string;
  channelType: 'WHATSAPP' | 'SMS';
  providerId: string;
  providerNumber: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserMappingSchema = new Schema<IUserMapping>(
  {
    ghlLocationId: { type: String, required: true, index: true },
    ghlUserId: { type: String, required: true, index: true },
    channelType: { type: String, enum: ['WHATSAPP', 'SMS'], required: true },
    providerId: { type: String, required: true },
    providerNumber: { type: String, required: true },
  },
  { timestamps: true }
);

UserMappingSchema.index({ ghlLocationId: 1, ghlUserId: 1, channelType: 1 }, { unique: true });

export const UserMapping = mongoose.models.UserMapping || mongoose.model<IUserMapping>('UserMapping', UserMappingSchema);
