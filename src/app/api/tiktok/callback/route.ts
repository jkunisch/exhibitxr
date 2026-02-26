import { NextResponse } from 'next/server';
import { TIKTOK_CONFIG } from '@/lib/tiktok';
import { getAdminDb } from '@/lib/firebaseAdmin';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.json({ error }, { status: 400 });
  }

  if (!code) {
    return NextResponse.json({ error: 'No code provided' }, { status: 400 });
  }

  try {
    const response = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cache-Control': 'no-cache',
      },
      body: new URLSearchParams({
        client_key: TIKTOK_CONFIG.CLIENT_KEY || '',
        client_secret: TIKTOK_CONFIG.CLIENT_SECRET || '',
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: TIKTOK_CONFIG.REDIRECT_URI || '',
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("TikTok Token Error:", data);
      return NextResponse.json({ error: 'Failed to fetch token', details: data }, { status: response.status });
    }

    // Save token to Firestore
    const db = getAdminDb();
    await db.collection('system_settings').doc('tiktok_auth').set({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in,
      refresh_expires_in: data.refresh_expires_in,
      updated_at: new Date().toISOString(),
    });

    return NextResponse.json({ 
      success: true, 
      message: 'TikTok auth successful. Tokens saved to Firestore.',
      data: {
        access_token: '***',
        expires_in: data.expires_in
      }
    });

  } catch (err: any) {
    console.error("TikTok Auth Error:", err);
    return NextResponse.json({ error: 'Internal server error', details: err.message }, { status: 500 });
  }
}
