import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { transformProjectToEvent } from '@/lib/data/events';
import { createAdminClient } from '@/lib/supabase/server';
import EventDetailClient from './EventDetailClient';

export const dynamic = 'force-dynamic';

async function EventDetailContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Validate that id is a valid UUID format
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  if (!isUuid) {
    notFound();
  }

  // Check Supabase projects table exclusively
  const supabase = createAdminClient();
  const { data: dbProject, error } = await supabase
    .from('projects')
    .select('*, organizations(name, is_verified), shifts(*)')
    .eq('id', id)
    .in('status', ['published', 'in_progress'])
    .maybeSingle();

  if (error || !dbProject) {
    notFound();
  }

  const event = transformProjectToEvent(dbProject);
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
          공고 정보를 불러오는 중…
        </div>
      }
    >
      <EventDetailContent params={params} />
    </Suspense>
  );
}
