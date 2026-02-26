import { getAdminDb } from './firebaseAdmin';

/**
 * TikTok API Config & Access Tokens
 * You will need to obtain these from developers.tiktok.com
 */
export const TIKTOK_CONFIG = {
    CLIENT_KEY: process.env.TIKTOK_CLIENT_KEY,
    CLIENT_SECRET: process.env.TIKTOK_CLIENT_SECRET,
    REDIRECT_URI: process.env.NEXT_PUBLIC_APP_URL + '/api/tiktok/callback',
};

/**
 * Retrieves a valid TikTok Access Token from Firestore.
 * If the token is expired or close to expiring, it uses the refresh token to get a new one.
 */
export async function getValidTikTokToken(): Promise<string> {
    const db = getAdminDb();
    const docRef = db.collection('system_settings').doc('tiktok_auth');
    const doc = await docRef.get();

    if (!doc.exists) {
        throw new Error('No TikTok auth data found in Firestore. Please authenticate via /api/tiktok/auth first.');
    }

    const data = doc.data() as any;
    const updatedAt = new Date(data.updated_at).getTime();
    const expiresInMs = (data.expires_in || 86400) * 1000;
    const now = Date.now();

    // Check if token is expired or expiring within 5 minutes
    if (now >= updatedAt + expiresInMs - 5 * 60 * 1000) {
        console.log("🔄 TikTok access token expired. Refreshing...");
        
        const response = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Cache-Control': 'no-cache',
            },
            body: new URLSearchParams({
                client_key: TIKTOK_CONFIG.CLIENT_KEY || '',
                client_secret: TIKTOK_CONFIG.CLIENT_SECRET || '',
                grant_type: 'refresh_token',
                refresh_token: data.refresh_token,
            }),
        });

        const refreshData = await response.json();

        if (!response.ok) {
            console.error("❌ TikTok Token Refresh Error:", refreshData);
            throw new Error(`Failed to refresh token: ${refreshData.error_description || 'Unknown error'}`);
        }

        // Update Firestore
        await docRef.set({
            access_token: refreshData.access_token,
            refresh_token: refreshData.refresh_token,
            expires_in: refreshData.expires_in,
            refresh_expires_in: refreshData.refresh_expires_in,
            updated_at: new Date().toISOString(),
        }, { merge: true });

        console.log("✅ TikTok token successfully refreshed.");
        return refreshData.access_token;
    }

    return data.access_token;
}

/**
 * Posts a video file to TikTok with the given caption.
 * Uses the Video Upload API (V2).
 */
export async function postToTikTok(videoPath: string, caption: string, hashtags: string[], accessToken?: string) {
    const fs = await import('fs');
    
    // Auto-fetch token if not provided
    if (!accessToken) {
        accessToken = await getValidTikTokToken();
    }

    const formData = new FormData();
    
    // 1. Prepare video file
    const videoBlob = new Blob([fs.readFileSync(videoPath)], { type: 'video/mp4' });
    formData.append('video', videoBlob, 'tiktok_post.mp4');
    
    // 2. Prepare metadata
    const meta = {
        title: caption,
        text: caption + ' ' + hashtags.map(h => `#${h}`).join(' '),
        privacy_level: 'PUBLIC_TO_EVERYONE',
        disable_comment: false,
        disable_duet: false,
        disable_stitch: false
    };
    formData.append('post_info', JSON.stringify(meta));

    console.log(`🚀 Posting to TikTok: "${caption}"...`);

    const response = await fetch('https://open.tiktokapis.com/v2/post/publish/video/self/', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            // TikTok expects multipart/form-data for video uploads
        },
        body: formData
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(`TikTok Upload Failed: ${JSON.stringify(error)}`);
    }

    const data = await response.json();
    console.log(`✅ Successfully posted to TikTok! Video ID: ${data.data?.publish_id}`);
    return data.data?.publish_id;
}
