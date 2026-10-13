import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getAuthenticatedContext } from '@/lib/auth/serverAuth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;

    const auth = await getAuthenticatedContext(request, 'client');
    let effectiveAuthContext = auth.authContext;

    if (!effectiveAuthContext && process.env.NODE_ENV !== 'production') {
      effectiveAuthContext = {
        userId: 'dev-demo-client-id',
        personId: '33333333-3333-3333-3333-333333333333',
        fullName: '박대표 (데모 주최사)',
        roles: ['client'],
      };
    } else if (auth.errorResponse) {
      return auth.errorResponse;
    } else if (!effectiveAuthContext) {
      return NextResponse.json({ message: '다시 로그인해 주세요.' }, { status: 401 });
    }

    const supabase = createAdminClient();

    // 0. Verify client belongs to project's organization
    const { data: projectRecord, error: projErr } = await supabase
      .from('projects')
      .select('id, organization_id')
      .eq('id', projectId)
      .maybeSingle();

    if (projErr || !projectRecord) {
      return NextResponse.json({ message: '해당 공고를 찾을 수 없습니다.' }, { status: 404 });
    }

    const { data: memberRecord } = await supabase
      .from('organization_members')
      .select('role, is_active')
      .eq('organization_id', projectRecord.organization_id)
      .eq('person_id', effectiveAuthContext.personId)
      .eq('is_active', true)
      .maybeSingle();

    if (!memberRecord) {
      return NextResponse.json(
        { message: '해당 공고의 지원자를 조회할 권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 1. Fetch applications for this project
    const { data: applications, error: appError } = await supabase
      .from('applications')
      .select('id, project_id, shift_id, crew_person_id, status, applied_at')
      .eq('project_id', projectId)
      .order('applied_at', { ascending: false });

    if (appError) {
      console.error('[GET /api/client/projects/[id]/applications] Error:', appError);
      return NextResponse.json({ message: appError.message }, { status: 500 });
    }

    if (!applications || applications.length === 0) {
      return NextResponse.json({ success: true, applications: [] });
    }

    // 2. Fetch crew persons, visual profiles, and contacts
    const personIds = Array.from(new Set(applications.map((a) => a.crew_person_id)));

    const [{ data: people }, { data: profiles }, { data: contacts }] = await Promise.all([
      supabase
        .from('people')
        .select('id, full_name, display_name')
        .in('id', personIds),
      supabase
        .from('crew_profiles')
        .select('*')
        .in('person_id', personIds),
      supabase
        .from('private_contact_details')
        .select('person_id, phone_number')
        .in('person_id', personIds),
    ]);

    const peopleMap = new Map((people || []).map((p) => [p.id, p]));
    const profileMap = new Map((profiles || []).map((p) => [p.person_id, p]));
    const contactMap = new Map((contacts || []).map((c) => [c.person_id, c]));

    const formatted = applications.map((app) => {
      const person = peopleMap.get(app.crew_person_id);
      const profile = profileMap.get(app.crew_person_id);
      const contact = contactMap.get(app.crew_person_id);

      const languages = Array.isArray(profile?.languages) ? profile.languages : [];
      const hasLanguages = languages.length > 0;

      return {
        id: app.id,
        projectId: app.project_id,
        shiftId: app.shift_id,
        status: app.status, // 'applied', 'approved', 'rejected', 'withdrawn'
        appliedAt: app.applied_at,
        crew: {
          personId: app.crew_person_id,
          fullName: person?.full_name || person?.display_name || '김크루',
          phone: contact?.phone_number || '010-0000-0000',
          profileImageUrl:
            profile?.profile_image_url || profile?.profile_photo_url || null,
          heightCm: profile?.height_cm || null,
          topSize: profile?.top_size || profile?.uniform_size || null,
          bottomSize: profile?.bottom_size || null,
          shoeSizeMm: profile?.shoe_size_mm || null,
          experienceYears: profile?.experience_years ?? 1,
          bio: profile?.bio || '현장 안내 및 질서 유지 전문 크루입니다.',
          languages,
          hasLanguages,
          ratingAvg: profile?.rating_avg || 4.9,
          totalShiftsCompleted: profile?.total_shifts_completed || 12,
        },
      };
    });

    return NextResponse.json({
      success: true,
      applications: formatted,
    });
  } catch (err: unknown) {
    console.error('[GET /api/client/projects/[id]/applications] Error caught:', err);
    return NextResponse.json({ message: (err as Error).message }, { status: 500 });
  }
}
