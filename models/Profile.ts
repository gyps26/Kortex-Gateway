import mongoose from 'mongoose';

export interface IProfile extends mongoose.Document {
  workerId: string;
  name: string;
  assignedLocationId?: string;
  appleId?: string;
  status: 'active' | 'inactive';
  lastPing: Date;
  dailyCount: number;
  dailyLimit: number;
  lastReset: Date;
  errorThreshold: number;
}

const profileSchema = new mongoose.Schema<IProfile>({
  workerId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  assignedLocationId: { type: String, index: true },
  appleId: { type: String },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  lastPing: { type: Date, default: Date.now },
  dailyCount: { type: Number, default: 0 },
  dailyLimit: { type: Number, default: 50 },
  lastReset: { type: Date, default: Date.now },
  errorThreshold: { type: Number, default: 0 },
});

export const Profile = mongoose.models.Profile || mongoose.model<IProfile>('Profile', profileSchema);
