import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getAuthenticatedContext } from '@/lib/auth/serverAuth';

export async function POST(request: Request) {
  try {
    // 1. Session user authentication & ownership guard
    const { authContext, errorResponse } = await getAuthenticatedContext(request, 'crew');
    if (errorResponse) {
      return errorResponse;
    }
    if (!authContext) {
      return NextResponse.json({ message: '다시 로그인해 주세요.' }, { status: 401 });
    }

    const body = await request.json();
    const {
      eventId,
      projectId: reqProjectId,
      shiftId: reqShiftId,
      applicantName,
      applicantPhone,
      selectedDates,
      agreeNotice,
      agreePrivacy,
    } = body;

    const hasAgreed = agreeNotice === true || agreePrivacy === true;
    if (!hasAgreed) {
      return NextResponse.json(
        { message: '개인정보 수집 및 행사 안내에 동의해 주세요.' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const targetProjectId = reqProjectId || eventId;

    if (!targetProjectId) {
      return NextResponse.json(
        { message: '지원할 공고 ID가 누락되었습니다.' },
        { status: 400 }
      );
    }

    // 2. Fetch project from DB
    const { data: project, error: projError } = await supabase
      .from('projects')
      .select('id, title, status, start_date, end_date, sow_spec')
      .eq('id', targetProjectId)
      .maybeSingle();

    if (projError || !project) {
      return NextResponse.json(
        { message: '해당 공고를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    if (project.status !== 'published' && project.status !== 'in_progress') {
      return NextResponse.json(
        { message: '모집이 종료되었거나 취소된 공고예요.' },
        { status: 400 }
      );
    }

    // 3. Fetch all shifts belonging to this project
    const { data: projectShifts, error: shiftError } = await supabase
      .from('shifts')
      .select('id, project_id, shift_name, date, start_time, end_time, daily_wage')
      .eq('project_id', targetProjectId)
      .order('date', { ascending: true });

    if (shiftError || !projectShifts || projectShifts.length === 0) {
      return NextResponse.json(
        { message: '지원 가능한 일정이 등록되어 있지 않습니다.' },
        { status: 404 }
      );
    }

    const sow = (project.sow_spec as Record<string, unknown>) || {};
    const isMultiDayRequired = Boolean(sow.isMultiDay || sow.isMultiDayRequired);

    // Determine target shifts to apply
    let targetShifts: typeof projectShifts = [];

    if (Array.isArray(selectedDates) && selectedDates.length > 0) {
      // Validate all selectedDates belong to project shifts
      const dateSet = new Set(selectedDates.map(String));
      targetShifts = projectShifts.filter((s) => {
        const sDate = s.date || (s.start_time ? s.start_time.slice(0, 10) : '');
        return dateSet.has(sDate);
      });

      if (targetShifts.length !== dateSet.size) {
        return NextResponse.json(
          { message: '선택한 일정 중 존재하지 않는 날짜가 포함되어 있습니다.' },
          { status: 400 }
        );
      }

      // Check full schedule requirement if applicable
      if (isMultiDayRequired && targetShifts.length < projectShifts.length) {
        return NextResponse.json(
          { message: '이 공고는 전체 일정 참여형 공고입니다. 모든 일정을 선택해 주세요.' },
          { status: 400 }
        );
      }
    } else if (reqShiftId) {
      const matchedShift = projectShifts.find((s) => s.id === reqShiftId);
      if (!matchedShift) {
        return NextResponse.json(
          { message: '해당 공고에 속하지 않는 일정입니다.' },
          { status: 400 }
        );
      }
      targetShifts = [matchedShift];
    } else if (projectShifts.length === 1) {
      targetShifts = [projectShifts[0]];
    } else {
      return NextResponse.json(
        { message: '지원할 일정을 선택해 주세요.' },
        { status: 400 }
      );
    }

    // 4. Duplicate application check for these shifts
    const targetShiftIds = targetShifts.map((s) => s.id);
    const { data: existingApps } = await supabase
      .from('applications')
      .select('id, shift_id, status')
      .in('shift_id', targetShiftIds)
      .eq('crew_person_id', authContext.personId);

    if (existingApps && existingApps.length > 0) {
      return NextResponse.json(
        { message: '이미 지원한 일정이 포함되어 있습니다.' },
        { status: 409 }
      );
    }

    // 5. Batch insert applications in a single atomic DB call
    const nowIso = new Date().toISOString();
    const rowsToInsert = targetShifts.map((s) => ({
      project_id: targetProjectId,
      shift_id: s.id,
      crew_person_id: authContext.personId,
      status: 'applied' as const,
      applied_at: nowIso,
    }));

    const { data: insertedApps, error: insertError } = await supabase
      .from('applications')
      .insert(rowsToInsert)
      .select('id, project_id, shift_id, status, applied_at');

    if (insertError || !insertedApps || insertedApps.length !== rowsToInsert.length) {
      console.error('[POST /api/crew/applications] Insert error:', insertError);
      return NextResponse.json(
        { message: '지원 신청을 접수하지 못했어요. 잠시 후 다시 시도해 주세요.' },
        { status: 500 }
      );
    }

    // 6. Update applicant profile contact details if provided
    if (applicantName) {
      await supabase
        .from('people')
        .update({
          full_name: applicantName,
          updated_at: nowIso,
        })
        .eq('id', authContext.personId);
    }

    if (applicantPhone) {
      await supabase
        .from('private_contact_details')
        .upsert(
          {
            person_id: authContext.personId,
            phone_number: applicantPhone,
            updated_at: nowIso,
          },
          { onConflict: 'person_id' }
        );
    }

    const appliedDates = targetShifts.map((s) => s.date || s.start_time.slice(0, 10));

    return NextResponse.json({
      success: true,
      applications: insertedApps,
      applicationCount: insertedApps.length,
      shiftId: insertedApps[0]?.shift_id,
      selectedDates: appliedDates,
      status: 'applied',
      appliedAt: nowIso,
      message: '지원이 성공적으로 접수되었어요.',
    });
  } catch (err: unknown) {
    console.error('[POST /api/crew/applications] Error:', err);
    return NextResponse.json(
      { message: (err as Error).message || '서버 오류가 발생했어요.' },
      { status: 500 }
    );
  }
}
