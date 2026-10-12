import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { EVENT_FEED_DATA, transformProjectToEvent, EventItem } from '@/lib/data/events';

export async function GET() {
  try {
    const supabase = createAdminClient();

    // 1. Fetch published/in_progress projects from DB with organization and shifts
    const { data: dbProjects, error } = await supabase
      .from('projects')
      .select('*, organizations(name), shifts(*)')
      .in('status', ['published', 'in_progress'])
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[GET /api/events] Error fetching projects:', error);
      return NextResponse.json({ success: true, events: EVENT_FEED_DATA });
    }

    // 2. Transform DB projects to EventItem format
    const dbEvents: EventItem[] = (dbProjects || []).map((p) => transformProjectToEvent(p));

    // 3. Merge: DB projects placed at the top, followed by mock data
    // Prevent duplicate IDs if any mock ID coincides with DB
    const dbIds = new Set(dbEvents.map((e) => e.id));
    const mergedEvents: EventItem[] = [
      ...dbEvents,
      ...EVENT_FEED_DATA.filter((e) => !dbIds.has(e.id)),
    ];

    return NextResponse.json({
      success: true,
      events: mergedEvents,
    });
  } catch (err: unknown) {
    console.error('[GET /api/events] Server error:', err);
    return NextResponse.json({
      success: true,
      events: EVENT_FEED_DATA,
    });
  }
}
