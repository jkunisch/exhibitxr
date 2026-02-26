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
 * Posts a video file to TikTok with the given caption.
 * Uses the Video Upload API (V2).
 */
export async function postToTikTok(videoPath: string, caption: string, hashtags: string[], accessToken: string) {
    const fs = await import('fs');
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
