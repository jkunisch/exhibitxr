import { NextRequest, NextResponse } from 'next/server';
import { pollTaskStatus } from '@/lib/meshy';
import { finalizePublicSnap } from '@/lib/snapFinalize';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await pollTaskStatus(id);
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
    return NextResponse.json({ error: 'Polling fehlgeschlagen' }, { status: 500 });
  }
}
