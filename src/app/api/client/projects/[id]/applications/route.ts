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
    if (auth.errorResponse) {
      return auth.errorResponse;
    }
    const effectiveAuthContext = auth.authContext;
    if (!effectiveAuthContext) {
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

    // 1. Fetch shifts for date info
    const { data: shifts } = await supabase
      .from('shifts')
      .select('id, date, start_time, end_time')
      .eq('project_id', projectId);

    const shiftMap = new Map((shifts || []).map((s) => [s.id, s]));

    // 2. Fetch applications for this project
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
      return NextResponse.json({ success: true, applications: [], crewApplicants: [] });
    }

    // 3. Fetch crew persons, visual profiles, and contacts
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

    // Format individual applications
    const formatted = applications.map((app) => {
      const person = peopleMap.get(app.crew_person_id);
      const profile = profileMap.get(app.crew_person_id);
      const contact = contactMap.get(app.crew_person_id);
      const shift = shiftMap.get(app.shift_id);

      const languages = Array.isArray(profile?.languages) ? profile.languages : [];
      const hasLanguages = languages.length > 0;

      return {
        id: app.id,
        projectId: app.project_id,
        shiftId: app.shift_id,
        shiftDate: shift?.date || '',
        status: app.status, // 'applied', 'approved', 'rejected', 'withdrawn'
        appliedAt: app.applied_at,
        crew: {
          personId: app.crew_person_id,
          fullName: person?.full_name || person?.display_name || '크루',
          phone: contact?.phone_number || '010-0000-0000',
          profileImageUrl: profile?.profile_image_url || null,
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

    // Group by crew member for single-card display per person
    const groupedMap = new Map<string, {
      crew: unknown;
      dates: Array<{
        applicationId: string;
        shiftId: string;
        date: string;
        status: string;
        appliedAt: string;
      }>;
    }>();

    for (const item of formatted) {
      const existing = groupedMap.get(item.crew.personId);
      const dateItem = {
        applicationId: item.id,
        shiftId: item.shiftId,
        date: item.shiftDate,
        status: item.status,
        appliedAt: item.appliedAt,
      };

      if (!existing) {
        groupedMap.set(item.crew.personId, {
          crew: item.crew,
          dates: [dateItem],
        });
      } else {
        existing.dates.push(dateItem);
      }
    }

    const crewApplicants = Array.from(groupedMap.values()).map((g) => {
      // Sort dates chronologically
      g.dates.sort((a, b) => a.date.localeCompare(b.date));
      const totalApplied = g.dates.length;
      const approvedCount = g.dates.filter((d) => d.status === 'approved').length;
      const allApproved = approvedCount === totalApplied;
      const partiallyApproved = approvedCount > 0 && !allApproved;

      return {
        ...g,
        totalApplied,
        approvedCount,
        allApproved,
        partiallyApproved,
      };
    });

    return NextResponse.json({
      success: true,
      applications: formatted,
      crewApplicants,
    });
  } catch (err: unknown) {
    console.error('[GET /api/client/projects/[id]/applications] Error caught:', err);
    return NextResponse.json({ message: (err as Error).message }, { status: 500 });
  }
}
