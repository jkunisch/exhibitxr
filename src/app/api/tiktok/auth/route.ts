import { NextResponse } from 'next/server';
import { TIKTOK_CONFIG } from '@/lib/tiktok';

export async function GET() {
  const clientKey = TIKTOK_CONFIG.CLIENT_KEY;
  const redirectUri = TIKTOK_CONFIG.REDIRECT_URI;
  
  if (!clientKey || !redirectUri) {
    return NextResponse.json({ error: 'Missing TikTok config' }, { status: 500 });
  }

  // Scopes required for uploading videos and basic info
  const scopes = ['user.info.basic', 'video.upload'];
  
  // Create a random state for CSRF protection
  const state = Math.random().toString(36).substring(7);
  
  const url = new URL('https://www.tiktok.com/v2/auth/authorize/');
  url.searchParams.append('client_key', clientKey);
  url.searchParams.append('scope', scopes.join(','));
  url.searchParams.append('response_type', 'code');
  url.searchParams.append('redirect_uri', redirectUri);
  url.searchParams.append('state', state);

  return NextResponse.redirect(url.toString());
}
