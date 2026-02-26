import { NextRequest, NextResponse } from 'next/server';
import { submitImageTo3D } from '@/lib/meshy';
import { buildSnapPreviewFilename } from '@/lib/snapImage';
import { submitImageToTripo } from '@/lib/tripo';
import { notifyModelGeneration } from '@/lib/telegram';
import { checkRateLimit } from '@/lib/rateLimit';

function getClientIp(request: NextRequest): string {
  // Prefer Cloudflare's normalized client IP header when present.
  const cfIp = request.headers.get('cf-connecting-ip')?.trim();
  if (cfIp) return cfIp;

  const realIp = request.headers.get('x-real-ip')?.trim();
  if (realIp) return realIp;

  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const firstHop = forwarded.split(',')[0]?.trim();
    if (firstHop) return firstHop;
  }

  return 'unknown';
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const image = formData.get('image');
    const provider = (formData.get('provider') as string) || 'premium';

    // SAFE MOCK MODE FOR DEVELOPMENT
    if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_MOCK_3D_API === 'true') {
      console.log('[MOCK MODE] Intercepted upload, returning mock task.');
      return NextResponse.json({ taskId: `mock-task-${Date.now()}`, provider });
    }

    // ── Rate limit: 5 generations per IP per hour ────────────────────
    const clientIp = getClientIp(request);
    const rateCheck = checkRateLimit(clientIp, 5, 60 * 60 * 1000);
    if (!rateCheck.allowed) {
      const retryMin = Math.ceil(rateCheck.retryAfterMs / 60000);
      return NextResponse.json(
        { error: `Zu viele Anfragen. Bitte in ${retryMin} Min. erneut versuchen.` },
        {
          status: 429,
          headers: { 'Retry-After': String(Math.ceil(rateCheck.retryAfterMs / 1000)) },
        },
      );
    }

    if (!(image instanceof Blob)) {
      return NextResponse.json({ error: 'Kein Bild gefunden.' }, { status: 400 });
    }

    if (image.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'Bild zu groß (max. 10 MB).' }, { status: 400 });
    }

    const buffer = Buffer.from(await image.arrayBuffer());
    const inputFile = image as File;
    const filename = buildSnapPreviewFilename(inputFile.name, inputFile.type);

    const result = provider === 'basic'
      ? await submitImageToTripo(buffer, filename)
      : await submitImageTo3D(buffer, filename);

    // Telegram notification for anonymous users (fire-and-forget)
    notifyModelGeneration({ provider, ip: clientIp }).catch(() => { });

    return NextResponse.json({ taskId: result.taskId, provider });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unbekannter Fehler';
    console.error('[snap-preview] POST error:', message);
    return NextResponse.json(
      { error: `Snap fehlgeschlagen: ${message}` },
      { status: 500 },
    );
  }
}
