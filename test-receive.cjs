async function run() {
  const r1 = await fetch('http://localhost:3000/api/gateway/devices', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ enabled: true })
  });
  const data1 = await r1.json();
  const workerId = data1.id;
  const apiKey = data1.apiKey;

  const r2 = await fetch('http://localhost:3000/api/gateway/devices', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
    body: JSON.stringify({ fcmToken: 'test' })
  });

  const r3 = await fetch(`http://localhost:3000/api/gateway/devices/${workerId}/receive-sms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
    body: JSON.stringify({ sender: '123456', message: 'test' })
  });
  console.log("RECEIVE SMS STATUS:", r3.status);
  const data3 = await r3.json();
  console.log("RECEIVE SMS RES:", data3);
}
run();
