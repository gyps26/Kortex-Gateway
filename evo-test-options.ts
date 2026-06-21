import axios from 'axios';

async function testEvo() {
  const payloads = [
    { number: '639669718411', text: 'Test 4: with options delay', options: { delay: 1200 } },
  ];

  for (const p of payloads) {
    try {
      console.log('Sending', p.text);
      const res = await axios.post('https://evoapi.gokortex.com/message/sendText/WhatsApp%20Line%201', {
        number: p.number,
        text: p.text,
        options: p.options
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
