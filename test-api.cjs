const crypto = require('crypto');
async function run() {
  const apiKey = crypto.randomBytes(32).toString('hex');
  console.log("API KEY:", apiKey);
  const r1 = await fetch('http://localhost:3000/api/gateway/devices', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ enabled: true })
  });
  const data1 = await r1.json();
  console.log("CREATE DEVICE RES:", data1);
  if (!data1.apiKey) return;
  const r2 = await fetch('http://localhost:3000/api/gateway/devices', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': data1.apiKey },
    body: JSON.stringify({ fcmToken: 'test', brand: 'Google', model: 'Pixel' })
  });
  console.log("CONNECT DEVICE STATUS:", r2.status);
  const data2 = await r2.json();
  console.log("CONNECT DEVICE RES:", data2);
}
run();
