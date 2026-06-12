import mongoose from 'mongoose';

export interface IMessage extends mongoose.Document {
  ghlContactId?: string;
  ghlMessageId?: string;
  locationId?: string;
  workerId?: string;
  phone: string;
  body: string;
  attachments?: string[];
  direction: 'inbound' | 'outbound';
  status: 'pending' | 'queued' | 'sent' | 'failed' | 'delivered';
  errorDetails?: string;
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new mongoose.Schema<IMessage>({
  ghlContactId: { type: String },
  ghlMessageId: { type: String },
  locationId: { type: String, index: true },
  workerId: { type: String }, // Which profile handled it
  phone: { type: String, required: true },
  body: { type: String, required: true },
  attachments: [{ type: String }],
  direction: { type: String, enum: ['inbound', 'outbound'], required: true },
  status: { type: String, enum: ['pending', 'queued', 'sent', 'failed', 'delivered'], default: 'pending' },
  errorDetails: { type: String },
}, { timestamps: true });

export const Message = mongoose.models.Message || mongoose.model<IMessage>('Message', messageSchema);
