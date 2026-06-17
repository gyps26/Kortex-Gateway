import { NextRequest, NextResponse } from 'next/server';

const GHL_OAUTH_URL = 'https://marketplace.leadconnectorhq.com/oauth/chooselocation';

export async function GET(req: NextRequest) {
  const clientId = process.env.NEXT_PUBLIC_GHL_CLIENT_ID || process.env.GHL_CLIENT_ID;
  const redirectUri = process.env.GHL_REDIRECT_URI || process.env.NEXT_PUBLIC_GHL_REDIRECT_URI || `${req.nextUrl.origin}/api/oauth/callback`;
  
  if (!clientId || !redirectUri) {
    return NextResponse.json({ error: 'Missing OAuth configuration' }, { status: 500 });
  }

  const scopes = 'conversations.readonly conversations.write conversations/message.readonly conversations/message.write contacts.readonly locations.readonly users.readonly';
  
  const url = new URL(GHL_OAUTH_URL);
  url.searchParams.append('response_type', 'code');
  url.searchParams.append('redirect_uri', redirectUri);
  url.searchParams.append('client_id', clientId);
  url.searchParams.append('scope', scopes);

  return NextResponse.redirect(url.toString());
}
