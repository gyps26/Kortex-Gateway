import mongoose from 'mongoose';
import { GhlLocation } from './models/GhlLocation';
import { getValidAccessToken } from './lib/ghl';
import axios from 'axios';

async function main() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/kortex');
  const loc = await GhlLocation.findOne();
  if (!loc) {
    console.log('No loc');
    process.exit(1);
  }
  const token = await getValidAccessToken(loc);
  
  const payloads = [
    { type: 'SMS', conversationProviderId: '6a302fd70da1421315aa6870' },
    { type: 'Custom', conversationProviderId: '6a302fd70da1421315aa6870' },
    { type: 'WhatsApp', conversationProviderId: '6a302ff401711da42e91e7fc' },
    { type: 'Custom', conversationProviderId: '6a302ff401711da42e91e7fc' }
  ];

  for (const p of payloads) {
    console.log(`Testing type=${p.type} provider=${p.conversationProviderId}`);
    try {
      await axios.post('https://services.leadconnectorhq.com/conversations/messages/inbound', {
        type: p.type,
        contactId: 'some-fake-id', // Just to trigger the type/provider validation first
        message: 'test',
        conversationProviderId: p.conversationProviderId
      }, {
        headers: { Authorization: `Bearer ${token}`, Version: '2021-07-28' }
      });
      console.log('SUCCESS');
    } catch (e: any) {
      console.log('FAILED:', e.response?.data || e.message);
    }
  }
  process.exit(0);
}
main();
