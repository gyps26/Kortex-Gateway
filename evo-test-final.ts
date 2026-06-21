import axios from 'axios';

async function testEvo() {
  try {
    console.log('Sending Test 8');
    const res = await axios.post('https://evoapi.gokortex.com/message/sendText/Line%20001', {
      number: '639669718411',
      text: 'Test 8: Evolution checkNumber',
      options: { delay: 1200, presence: 'composing', linkPreview: false }
    }, {
      headers: {
        'Content-Type': 'application/json',
        'apikey': 'A250A755-6EBD-4318-979D-647E9721F844'
      }
    });
    console.log('Success:', res.data.status, JSON.stringify(res.data).substring(0, 200));
  } catch (e: any) {
    console.log('Error:', e.response?.data || e.message);
  }
}
testEvo();
