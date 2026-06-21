import mongoose from 'mongoose';

export interface IGlobalSettings {
  ghlClientId: string;
  ghlClientSecret: string;
}

const globalSettingsSchema = new mongoose.Schema<IGlobalSettings>(
  {
    ghlClientId: { type: String, default: '' },
    ghlClientSecret: { type: String, default: '' },
  },
  { timestamps: true }
);

export const GlobalSettings =
  mongoose.models.GlobalSettings || mongoose.model<IGlobalSettings>('GlobalSettings', globalSettingsSchema);
