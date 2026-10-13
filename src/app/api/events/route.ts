import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { transformProjectToEvent, EventItem } from '@/lib/data/events';

interface SocialProofRpcRow {
  project_id: string;
  applicant_count: number | string;
  new_applicant_count_24h: number | string;
  latest_applied_at: string | null;
  avatars: { avatarUrl?: string | null; isDemo?: boolean }[];
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sort = searchParams.get('sort') || 'latest';
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : undefined;
    const categoryFilter = searchParams.get('category');
    const regionFilter = searchParams.get('region');
    const isMvp = process.env.CREWLINK_IS_MVP !== 'false';

    const supabase = createAdminClient();

    // 1. Fetch published/in_progress projects from DB with organization and shifts
    const { data: dbProjects, error } = await supabase
      .from('projects')
      .select('id, organization_id, title, description, venue_name, road_address, detail_address, status, sow_spec, latitude, longitude, start_date, end_date, is_demo, created_at, organizations(name, is_verified), shifts(id, shift_name, required_headcount, start_time, end_time, hourly_rate_won, daily_wage, date)')
      .in('status', ['published', 'in_progress'])
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[GET /api/events] Database error fetching projects:', error);
      return NextResponse.json(
        { success: false, message: '공고 목록을 불러오는 중 데이터베이스 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    if (!dbProjects || dbProjects.length === 0) {
      return NextResponse.json({
        success: true,
        events: [],
        totalCount: 0,
      });
    }

    // 2. Query aggregate social proof via RPC for all candidate projects
    const projectIds = dbProjects.map((p) => p.id);
    const { data: proofRows, error: proofError } = await supabase.rpc('get_events_social_proof', {
      p_project_ids: projectIds,
      p_reference_time: new Date().toISOString(),
      p_is_mvp: isMvp,
    });

    if (proofError) {
      console.warn('[GET /api/events] Notice: get_events_social_proof RPC error:', proofError);
    }

    const proofMap = new Map<string, SocialProofRpcRow>();
    if (Array.isArray(proofRows)) {
      for (const row of proofRows as unknown as SocialProofRpcRow[]) {
        proofMap.set(row.project_id, row);
      }
    }

    // 3. Transform DB projects to EventItem format with social proof DTO
    let transformedEvents: EventItem[] = dbProjects.map((p) => {
      const proof = proofMap.get(p.id);
      const applicantCount = proof ? Number(proof.applicant_count || 0) : 0;
      const newApplicantCount24h = proof ? Number(proof.new_applicant_count_24h || 0) : 0;
      const avatars = Array.isArray(proof?.avatars) ? proof.avatars : [];
      const overflowCount = Math.max(0, applicantCount - avatars.length);

      const socialProof = {
        mode: (p.is_demo ? 'demo-photo' : avatars.length > 0 ? 'demo-photo' : 'anonymous') as 'demo-photo' | 'anonymous' | 'none',
        avatars,
        overflowCount,
      };

      return transformProjectToEvent(p, {
        applicantCount,
        newApplicantCount24h,
        activityUpdatedAt: proof?.latest_applied_at || p.created_at,
        isDemo: Boolean(p.is_demo),
        socialProof,
      });
    });

    // 4. Apply optional filters
    if (categoryFilter && categoryFilter !== 'all') {
      transformedEvents = transformedEvents.filter((e) => e.category === categoryFilter);
    }
    if (regionFilter && regionFilter !== 'all') {
      transformedEvents = transformedEvents.filter((e) => e.regionId === regionFilter);
    }

    // 5. Apply sorting
    if (sort === 'popular') {
      // 1. newApplicantCount24h DESC
      // 2. applicantCount DESC
      // 3. createdAt DESC
      // 4. id ASC
      transformedEvents.sort((a, b) => {
        const diff24h = (b.newApplicantCount24h || 0) - (a.newApplicantCount24h || 0);
        if (diff24h !== 0) return diff24h;

        const diffTotal = (b.applicantCount || 0) - (a.applicantCount || 0);
        if (diffTotal !== 0) return diffTotal;

        const diffCreated = b.createdAt.localeCompare(a.createdAt);
        if (diffCreated !== 0) return diffCreated;

        return a.id.localeCompare(b.id);
      });
    } else if (sort === 'deadline') {
      transformedEvents.sort((a, b) => a.deadlineDate.localeCompare(b.deadlineDate));
    } else if (sort === 'wage_desc') {
      transformedEvents.sort((a, b) => b.dailyWageWon - a.dailyWageWon);
    } else if (sort === 'recommend') {
      // 추천순: D-day + 보수 + 최신 가중치
      transformedEvents.sort((a, b) => {
        const wageDiff = b.dailyWageWon - a.dailyWageWon;
        if (wageDiff !== 0) return wageDiff;
        return b.createdAt.localeCompare(a.createdAt);
      });
    } else {
      // default: latest
      transformedEvents.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }

    // 6. Apply limit if provided
    const totalCount = transformedEvents.length;
    if (typeof limit === 'number' && limit > 0) {
      transformedEvents = transformedEvents.slice(0, limit);
    }

    return NextResponse.json({
      success: true,
      events: transformedEvents,
      totalCount,
    });
  } catch (err: unknown) {
    console.error('[GET /api/events] Server error:', err);
    return NextResponse.json(
      { success: false, message: (err as Error).message || '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
