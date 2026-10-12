import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getPublicEvents, getEventById, transformProjectToEvent } from '@/lib/data/events';
import { createAdminClient } from '@/lib/supabase/server';
import EventDetailClient from './EventDetailClient';


export function generateStaticParams() {
  return getPublicEvents().map((e) => ({
    id: e.id,
  }));
}

async function EventDetailContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let event = getEventById(id);

  if (!event) {
    // Check Supabase projects table
    const supabase = createAdminClient();
    const { data: dbProject } = await supabase
      .from('projects')
      .select('*, organizations(name), shifts(*)')
      .eq('id', id)
      .maybeSingle();

    if (dbProject) {
      event = transformProjectToEvent(dbProject);
    }
  }

  if (!event) {
    notFound();
  }

  return <EventDetailClient id={id} event={event} />;
}

export default function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-canvas flex items-center justify-center p-6 text-muted text-xs">
          불러오는 중…
        </div>
      }
    >
      <EventDetailContent params={params} />
    </Suspense>
  );
}
