import { NextRequest, NextResponse } from 'next/server';
import { pollTaskStatus } from '@/lib/meshy';
import { pollTripoTaskStatus } from '@/lib/tripo';
import { finalizePublicSnap } from '@/lib/snapFinalize';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const provider = request.nextUrl.searchParams.get('provider') || 'premium';

    // Use the correct poll function based on provider
    const pollFn = provider === 'basic' ? pollTripoTaskStatus : pollTaskStatus;
    const result = await pollFn(id);

    const shouldFinalize = result.status === 'SUCCEEDED' && Boolean(result.glbUrl);

    if (shouldFinalize && result.glbUrl) {
      const finalizedGlbUrl = await finalizePublicSnap(id, result.glbUrl);

      return NextResponse.json({
        status: result.status,
        progress: result.progress,
        glbUrl: finalizedGlbUrl,
        error: result.error
      });
    }

    return NextResponse.json({
      status: result.status,
      progress: result.progress,
      glbUrl: undefined,
      error: result.error
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Polling fehlgeschlagen';
    console.error('[snap-preview] poll error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
