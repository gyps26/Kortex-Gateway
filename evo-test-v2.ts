import axios from 'axios';

async function testEvo() {
  try {
    console.log('Sending Test 10 to external number (V2 Docs format)');
    const res = await axios.post('https://evoapi.gokortex.com/message/sendText/Line%20001', {
      number: '639669718411',
      textMessage: {
        text: 'Test 10: V2 Docs format'
      },
      delay: 1200,
      linkPreview: false
    }, {
      headers: {
        'Content-Type': 'application/json',
        'apikey': '7B8BDB10-3525-47EC-AC6E-95CF51D6B0C2'
      }
    });
    console.log('Success:', res.data.status, JSON.stringify(res.data).substring(0, 200));
  } catch (e: any) {
    console.log('Error:', e.response?.data ? JSON.stringify(e.response.data) : e.message);
  }
}
testEvo();
