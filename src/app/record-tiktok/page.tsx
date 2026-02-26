'use client';

import { useSearchParams } from 'next/navigation';
import EmbedViewer from '@/components/3d/EmbedViewer';
import { Suspense } from 'react';

function RecordViewer() {
  const searchParams = useSearchParams();
  const modelUrl = searchParams.get('modelUrl');

  if (!modelUrl) {
    return <div className="p-10 text-white">No modelUrl provided.</div>;
  }

  return (
    <div className="w-[1080px] h-[1920px] bg-black">
      <EmbedViewer 
        modelUrl={modelUrl} 
        autoRotate={true}
        title="TikTok Recording"
      />
    </div>
  );
}

export default function RecordPage() {
  return (
    <Suspense fallback={<div className="bg-black w-full h-screen" />}>
      <RecordViewer />
    </Suspense>
  );
}
