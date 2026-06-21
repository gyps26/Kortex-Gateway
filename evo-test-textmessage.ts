import axios from 'axios';

async function testEvo() {
  try {
    console.log('Sending Test 7');
    const res = await axios.post('https://evoapi.gokortex.com/message/sendText/WhatsApp%20Line%201', {
      number: '639669718411',
      textMessage: { text: 'Test 7: textMessage format' },
      options: { delay: 1200, presence: 'composing' }
    }, {
      headers: {
        'Content-Type': 'application/json',
        'apikey': 'A250A755-6EBD-4318-979D-647E9721F844'
      }
    });
    console.log('Success:', res.data.status, JSON.stringify(res.data));
  } catch (e: any) {
    console.log('Error:', e.response?.data || e.message);
  }
}
testEvo();
