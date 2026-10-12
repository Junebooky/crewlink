import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const minLat = parseFloat(searchParams.get('min_lat') || '');
    const minLng = parseFloat(searchParams.get('min_lng') || '');
    const maxLat = parseFloat(searchParams.get('max_lat') || '');
    const maxLng = parseFloat(searchParams.get('max_lng') || '');

    if (isNaN(minLat) || isNaN(minLng) || isNaN(maxLat) || isNaN(maxLng)) {
      return NextResponse.json(
        { message: 'min_lat, min_lng, max_lat, max_lng 파라미터가 유효하지 않습니다.' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase.rpc('get_events_in_bounds', {
      min_lat: minLat,
      min_lng: minLng,
      max_lat: maxLat,
      max_lng: maxLng,
    });

    if (error) {
      console.error('[GET /api/events/bounds] RPC error:', error);
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    return NextResponse.json({ events: data || [] });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : '서버 에러가 발생했습니다.';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}
