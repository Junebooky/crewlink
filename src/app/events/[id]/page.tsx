import { Suspense } from 'react';
import { EVENT_FEED_DATA } from '@/lib/data/events';
import EventDetailClient from './EventDetailClient';

export function generateStaticParams() {
  return EVENT_FEED_DATA.map((e) => ({
    id: e.id,
  }));
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-canvas flex items-center justify-center p-6 text-muted text-xs">
          불러오는 중…
        </div>
      }
    >
      <EventDetailClient id={id} />
    </Suspense>
  );
}
