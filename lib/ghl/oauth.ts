import axios from 'axios';

const GHL_TOKEN_URL = 'https://services.leadconnectorhq.com/oauth/token';

export async function exchangeToken(
  code: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string
) {
  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
  });

  try {
    const response = await axios.post(GHL_TOKEN_URL, params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return response.data;
  } catch (error: any) {
    console.error('Error exchanging GHL token:', error.response?.data || error.message);
    throw error;
  }
}
