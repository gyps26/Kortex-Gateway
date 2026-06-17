import mongoose from 'mongoose';
import { Message } from './models/Message';

async function run() {
  await mongoose.connect('mongodb://localhost:27017/kortex');
  const messages = await Message.find().sort({ createdAt: -1 }).limit(5);
  console.log("Recent messages:", JSON.stringify(messages, null, 2));
  process.exit(0);
}
run();
