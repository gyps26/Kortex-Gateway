import axios from 'axios';

async function testEvo() {
  const payloads = [
    { number: '639669718411', text: 'Test 1: just number' },
    { number: '639669718411@s.whatsapp.net', text: 'Test 2: JID format' },
    { number: '+639669718411', text: 'Test 3: plus sign' },
  ];

  for (const p of payloads) {
    try {
      console.log('Sending', p.text);
      const res = await axios.post('https://evoapi.gokortex.com/message/sendText/WhatsApp%20Line%201', {
        number: p.number,
        text: p.text
      }, {
        headers: {
          'Content-Type': 'application/json',
          'apikey': 'A250A755-6EBD-4318-979D-647E9721F844'
        }
      });
      console.log('Success:', res.data.status, res.data?.message?.conversation || res.data?.text);
    } catch (e: any) {
      console.log('Error:', e.response?.data || e.message);
    }
  }
}
testEvo();
