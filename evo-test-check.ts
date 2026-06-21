import axios from 'axios';

async function testEvo() {
  try {
    console.log('Checking number on WhatsApp...');
    const checkRes = await axios.post('https://evoapi.gokortex.com/chat/whatsappNumbers/Line%20001', {
      numbers: ['639669718411']
    }, {
      headers: {
        'Content-Type': 'application/json',
        'apikey': '7B8BDB10-3525-47EC-AC6E-95CF51D6B0C2'
      }
    });
    console.log('Check result:', JSON.stringify(checkRes.data));

    if (checkRes.data && checkRes.data[0] && checkRes.data[0].exists) {
      console.log('Number exists! Proceeding to send...');
      const jid = checkRes.data[0].jid;
      
      const res = await axios.post('https://evoapi.gokortex.com/message/sendText/Line%20001', {
        number: jid,
        text: 'Test 12: Sent after checking number',
      }, {
        headers: {
          'Content-Type': 'application/json',
          'apikey': '7B8BDB10-3525-47EC-AC6E-95CF51D6B0C2'
        }
      });
      console.log('Send Success:', res.data.status, JSON.stringify(res.data).substring(0, 200));
    } else {
      console.log('Number does not exist on WhatsApp according to API.');
    }
  } catch (e: any) {
    console.log('Error:', e.response?.data ? JSON.stringify(e.response.data) : e.message);
  }
}
testEvo();
