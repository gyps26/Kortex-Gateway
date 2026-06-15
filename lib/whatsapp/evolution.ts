import axios from 'axios';

const EVOLUTION_API_BASE_URL = 'https://evoapi.gokortex.com';

export async function sendEvolutionTextMessage(
  to: string,
  text: string,
  instanceName: string,
  apiKey: string
): Promise<any> {
  const url = `${EVOLUTION_API_BASE_URL}/message/sendText/${instanceName}`;
  const payload = {
    number: to,
    options: {
      delay: 1200,
      presence: 'composing',
    },
    text: text,
  };

  try {
    const response = await axios.post(url, payload, {
      headers: {
        'Content-Type': 'application/json',
        apikey: apiKey,
      },
    });
    return response.data;
  } catch (error: any) {
    console.error(`Error sending message via Evolution API (instance: ${instanceName}):`, error.response?.data || error.message);
    throw error;
  }
}
